import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { parseJsonFromLLM } from '../utils/parse-json.js';
import { geminiGenerateContent } from '../utils/gemini.js';
import {
  checkSignalGrounding,
  hasBannedPhrase,
  validateVariantLength,
} from '../utils/variant-validation.js';
import type { FirstLineVariant } from './personalize.agent.js';

const DEFAULT_QA_PROMPT =
  'You are an independent QA reviewer for Preframe cold-email first lines. Score honestly and reject anything that is not genuinely good. Return only valid JSON.';

export interface QABrief {
  name: string;
  title?: string;
  company?: string;
  research_summary: string;
  top_3_signals: unknown;
}

export interface QAResult {
  variant_number: number;
  grounded: boolean;
  specificity_score: number;
  human_ness_score: number;
  relevance_score: number;
  length_ok: boolean;
  qa_score: number;
  qa_verdict: 'ship' | 'reject';
  qa_reason: string;
}

interface QAScoresWrapper {
  scores?: Array<Record<string, unknown>>;
}

export function passesW45Criteria(qa: QAResult): boolean {
  return (
    qa.grounded === true &&
    qa.qa_score >= config.qaScoreFloor &&
    qa.specificity_score >= config.qaScoreFloor &&
    qa.human_ness_score >= config.qaScoreFloor &&
    qa.relevance_score >= config.qaScoreFloor &&
    qa.length_ok === true &&
    qa.qa_verdict === 'ship'
  );
}

function mapScoreRow(row: Record<string, unknown>, fallbackIndex: number): QAResult {
  const variant_number = Number(row.variant_number) || fallbackIndex + 1;
  const grounded = row.grounded === true;
  const specificity_score = Number(row.specificity_score ?? 0);
  const human_ness_score = Number(row.human_ness_score ?? 0);
  const relevance_score = Number(row.relevance_score ?? 0);
  const length_ok = row.length_ok === true;
  const qa_score = Number(row.score ?? row.qa_score ?? 0);
  const verdictRaw = String(row.verdict ?? row.qa_verdict ?? 'reject').toLowerCase();
  const qa_verdict = verdictRaw === 'ship' ? 'ship' : 'reject';
  const qa_reason = String(row.reason ?? row.qa_reason ?? '');

  return {
    variant_number,
    grounded,
    specificity_score,
    human_ness_score,
    relevance_score,
    length_ok,
    qa_score,
    qa_verdict,
    qa_reason,
  };
}

function ensureAllVariantsScored(variants: FirstLineVariant[], results: QAResult[]): QAResult[] {
  return variants.map((v, i) => {
    const existing = results.find((r) => r.variant_number === v.variant_number);
    if (existing) return existing;
    return {
      variant_number: v.variant_number || i + 1,
      grounded: false,
      specificity_score: 0,
      human_ness_score: 0,
      relevance_score: 0,
      length_ok: false,
      qa_score: 0,
      qa_verdict: 'reject',
      qa_reason: 'QA agent did not score this variant',
    };
  });
}

/** Merge LLM QA scores with deterministic checks (length, banned phrases, signal grounding). */
export function applyProgrammaticQAChecks(
  variant: FirstLineVariant,
  qa: QAResult,
  brief: QABrief
): QAResult {
  let next = { ...qa };
  const reasons: string[] = next.qa_reason ? [next.qa_reason] : [];

  const length = validateVariantLength(variant.subject, variant.opener, variant.bridge);
  if (!length.length_ok) {
    next.length_ok = false;
    reasons.push(`length: ${length.errors.join(', ')}`);
  } else {
    next.length_ok = true;
  }

  if (hasBannedPhrase(variant.subject) || hasBannedPhrase(variant.opener) || hasBannedPhrase(variant.bridge)) {
    next.human_ness_score = Math.min(next.human_ness_score, 4);
    reasons.push('banned phrase detected');
  }

  const briefForGrounding = {
    research_summary: brief.research_summary,
    top_3_signals: brief.top_3_signals,
  };
  if (variant.signal_used.toUpperCase() !== 'NONE' && !checkSignalGrounding(variant.signal_used, briefForGrounding)) {
    next.grounded = false;
    reasons.push('signal_used not found in research brief');
  }

  if (
    !next.grounded ||
    !next.length_ok ||
    next.qa_score < config.qaScoreFloor ||
    next.specificity_score < config.qaScoreFloor ||
    next.human_ness_score < config.qaScoreFloor ||
    next.relevance_score < config.qaScoreFloor
  ) {
    next.qa_verdict = 'reject';
  }

  next.qa_reason = reasons.filter(Boolean).join('; ') || next.qa_reason;
  return next;
}

export async function runQAAgent(
  prospectId: string,
  variants: FirstLineVariant[],
  researchBrief: QABrief,
  systemPrompt = DEFAULT_QA_PROMPT
): Promise<QAResult[]> {
  const userMessage = `Prospect:
Name: ${researchBrief.name}
Title: ${researchBrief.title ?? ''}
Company: ${researchBrief.company ?? ''}

Research brief:
${researchBrief.research_summary}

Top 3 signals:
${JSON.stringify(researchBrief.top_3_signals, null, 2)}

Variants to score (each must receive a score entry):
${JSON.stringify(
  variants.map((v) => ({
    variant_number: v.variant_number,
    signal_used: v.signal_used,
    subject: v.subject,
    opener: v.opener,
    bridge: v.bridge,
  })),
  null,
  2
)}`;

  const { text, usage } = await geminiGenerateContent(systemPrompt, userMessage);

  await logCost({
    agentName: 'qa_agent',
    prospectId,
    model: config.qaModel,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  const parsed = parseJsonFromLLM<QAResult[] | QAScoresWrapper>(text);
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.scores)
      ? parsed.scores
      : [];

  if (rows.length === 0) {
    throw new Error('QA agent returned no results');
  }

  const mapped = ensureAllVariantsScored(
    variants,
    rows.map((row, i) => mapScoreRow(row as Record<string, unknown>, i))
  );

  return mapped.map((qa) => {
    const variant = variants.find((v) => v.variant_number === qa.variant_number);
    if (!variant) return qa;
    return applyProgrammaticQAChecks(variant, qa, researchBrief);
  });
}

export function pickBestVariant(
  variants: FirstLineVariant[],
  qaResults: QAResult[]
): { variant: FirstLineVariant; qa: QAResult } | null {
  const passed = variants
    .map((v) => {
      const qa = qaResults.find((q) => q.variant_number === v.variant_number);
      if (!qa || !passesW45Criteria(qa)) return null;
      return { variant: v, qa };
    })
    .filter((x): x is { variant: FirstLineVariant; qa: QAResult } => x !== null);

  if (passed.length === 0) return null;

  passed.sort((a, b) => {
    if (b.qa.qa_score !== a.qa.qa_score) return b.qa.qa_score - a.qa.qa_score;
    return b.qa.relevance_score - a.qa.relevance_score;
  });
  return passed[0];
}

/** Highest QA score in an attempt (even if none ship). */
export function maxQaScore(qaResults: QAResult[]): number {
  if (qaResults.length === 0) return 0;
  return Math.max(...qaResults.map((q) => q.qa_score));
}

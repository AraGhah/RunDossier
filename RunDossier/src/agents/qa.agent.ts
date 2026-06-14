import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logCost } from '../utils/cost-tracker.js';
import { extractTextContent, parseJsonFromLLM } from '../utils/parse-json.js';
import type { FirstLineVariant } from './personalize.agent.js';

const client = new Anthropic({ apiKey: config.anthropicKey });

const DEFAULT_QA_PROMPT =
  'You are an independent QA reviewer for Preframe cold-email first lines. Score honestly and reject anything that is not genuinely good. Return only valid JSON.';

export interface QABrief {
  name: string;
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
    qa.length_ok === true &&
    qa.qa_verdict === 'ship'
  );
}

function mapScoreRow(row: Record<string, unknown>, fallbackIndex: number): QAResult {
  const variant_number = Number(row.variant_number) || fallbackIndex + 1;
  const grounded = row.grounded !== false;
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

export async function runQAAgent(
  prospectId: string,
  variants: FirstLineVariant[],
  researchBrief: QABrief,
  systemPrompt = DEFAULT_QA_PROMPT
): Promise<QAResult[]> {
  const userMessage = `Research brief:
${researchBrief.research_summary}

Top 3 signals:
${JSON.stringify(researchBrief.top_3_signals)}

Variants to score:
${JSON.stringify(variants.map(v => ({
  variant_number: v.variant_number,
  signal_used: v.signal_used,
  subject: v.subject,
  opener: v.opener,
  bridge: v.bridge,
})))}`;

  const response = await client.messages.create({
    model: config.researchModel,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = extractTextContent(response.content);

  await logCost({
    agentName: 'qa_agent',
    prospectId,
    model: config.researchModel,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
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

  return rows.map((row, i) =>
    mapScoreRow(row as Record<string, unknown>, i)
  );
}

export function pickBestVariant(
  variants: FirstLineVariant[],
  qaResults: QAResult[]
): { variant: FirstLineVariant; qa: QAResult } | null {
  const passed = variants
    .map(v => {
      const qa = qaResults.find(q => q.variant_number === v.variant_number);
      if (!qa || !passesW45Criteria(qa)) return null;
      return { variant: v, qa };
    })
    .filter((x): x is { variant: FirstLineVariant; qa: QAResult } => x !== null);

  if (passed.length === 0) return null;

  passed.sort((a, b) => b.qa.qa_score - a.qa.qa_score);
  return passed[0];
}

import type { ResearchOutput } from '../agents/research.agent.js';
import { evaluateResearchQuality } from './research-quality.js';

export interface PersonalizeGateInput {
  research_summary: string | null;
  top_3_signals: unknown;
  confidence_score?: number | null;
}

export interface PersonalizeGateResult {
  ok: boolean;
  reason: string;
}

function normalizeSignals(raw: unknown): ResearchOutput['top_3_signals'] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'null') return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Block personalization when research is too thin — saves model cost and alert noise. */
export function assessPersonalizeGate(input: PersonalizeGateInput): PersonalizeGateResult {
  const summary = String(input.research_summary ?? '').trim();
  const signals = normalizeSignals(input.top_3_signals);
  const confidence =
    typeof input.confidence_score === 'number' && Number.isFinite(input.confidence_score)
      ? input.confidence_score
      : 0;

  if (!summary && signals.length === 0) {
    return { ok: false, reason: 'missing_research_summary_and_signals' };
  }

  const quality = evaluateResearchQuality({
    top_3_signals: signals,
    buying_triggers: [],
    research_summary: summary,
    confidence_score: confidence,
  });

  if (!quality.acceptable) {
    return { ok: false, reason: quality.reason ?? 'research_not_personalizable' };
  }

  return { ok: true, reason: 'ok' };
}

export function isModelRefusalText(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith('i cannot') ||
    lower.startsWith("i can't") ||
    lower.includes('cannot generate') ||
    lower.includes('no verifiable information') ||
    lower.includes('signals are both null') ||
    lower.includes('inventing facts')
  );
}

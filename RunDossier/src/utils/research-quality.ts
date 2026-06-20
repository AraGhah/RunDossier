import type { ResearchOutput, ResearchSignal } from '../agents/research.agent.js';
import { config } from '../config.js';

export interface ResearchQualityResult {
  acceptable: boolean;
  reason: string | null;
  meaningfulSignalCount: number;
  effectiveConfidence: number;
}

const VAGUE_SIGNAL_PATTERNS = [
  /\b(leading|innovative|dynamic|world[- ]class|cutting[- ]edge)\b/i,
  /\b(works at|employed at|currently at)\b/i,
  /\b(various|multiple|several)\s+(projects|initiatives|roles)\b/i,
  /^.{0,25}$/,
];

const GENERIC_SUMMARY_PATTERNS = [
  /\b(no specific|limited|insufficient|not enough)\b/i,
  /\b(generic|vague|unclear)\b/i,
];

function isMeaningfulSignal(signal: ResearchSignal): boolean {
  const text = String(signal.signal ?? '').trim();
  const source = String(signal.source ?? '').trim();
  if (text.length < 20 || source.length < 3) return false;
  if (VAGUE_SIGNAL_PATTERNS.some((re) => re.test(text))) return false;
  return true;
}

function hasVerifiableSource(signal: ResearchSignal): boolean {
  const source = String(signal.source ?? '').trim();
  if (source.length < 3) return false;
  if (/^(linkedin|apollo|podcast|sales.?nav|web|news)$/i.test(source) && source.length < 8) {
    return false;
  }
  return true;
}

/**
 * Quality gate for W3 research output. Weak research must not enter personalization.
 */
export function evaluateResearchQuality(output: ResearchOutput): ResearchQualityResult {
  const signals = Array.isArray(output.top_3_signals) ? output.top_3_signals : [];
  const meaningful = signals.filter((s) => isMeaningfulSignal(s) && hasVerifiableSource(s));
  const confidence = typeof output.confidence_score === 'number' ? output.confidence_score : 0;
  const summary = String(output.research_summary ?? '').trim();

  if (meaningful.length < 2) {
    return {
      acceptable: false,
      reason: 'fewer_than_2_verifiable_signals',
      meaningfulSignalCount: meaningful.length,
      effectiveConfidence: confidence,
    };
  }

  if (confidence < config.confidenceFloor) {
    return {
      acceptable: false,
      reason: 'confidence_below_floor',
      meaningfulSignalCount: meaningful.length,
      effectiveConfidence: confidence,
    };
  }

  if (!summary || summary.length < 40) {
    return {
      acceptable: false,
      reason: 'summary_too_short',
      meaningfulSignalCount: meaningful.length,
      effectiveConfidence: confidence,
    };
  }

  if (GENERIC_SUMMARY_PATTERNS.some((re) => re.test(summary))) {
    return {
      acceptable: false,
      reason: 'generic_summary',
      meaningfulSignalCount: meaningful.length,
      effectiveConfidence: confidence,
    };
  }

  const uniqueSignals = new Set(meaningful.map((s) => s.signal.trim().toLowerCase()));
  if (uniqueSignals.size < 2) {
    return {
      acceptable: false,
      reason: 'duplicate_signals',
      meaningfulSignalCount: meaningful.length,
      effectiveConfidence: confidence,
    };
  }

  return {
    acceptable: true,
    reason: null,
    meaningfulSignalCount: meaningful.length,
    effectiveConfidence: confidence,
  };
}

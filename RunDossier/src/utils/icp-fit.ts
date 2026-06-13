/** Rule-based ICP fit for outbound-agency buyers (Workflow 10). */

const ICP_TITLE_PATTERNS = [
  /\bfounder\b/i,
  /\bco-?founder\b/i,
  /\bhead of outbound\b/i,
  /\bvp\s+sales\b/i,
  /\bvice president\b.*\bsales\b/i,
  /\bdirector\b.*\boutbound\b/i,
  /\boutbound\b.*\b(lead|head|director)\b/i,
];

const AGENCY_KEYWORDS =
  /\b(outbound|cold email|sdr|prospecting|lead gen|appointment setting|sales agency|growth agency|b2b agency)\b/i;

export interface IcpFitInput {
  title: string;
  company?: string;
  employeeCount?: number | null;
  researchSummary?: string;
}

export function scoreIcpFit(input: IcpFitInput): number {
  const title = (input.title ?? '').trim();
  const company = (input.company ?? '').trim();
  const summary = (input.researchSummary ?? '').trim();
  const combined = `${title} ${company} ${summary}`;

  let score = 0;

  if (ICP_TITLE_PATTERNS.some((re) => re.test(title))) {
    score += 40;
  } else if (/\boutbound\b/i.test(title) || /\bsales\b/i.test(title)) {
    score += 20;
  }

  const employees = input.employeeCount;
  if (employees != null) {
    if (employees >= 10 && employees <= 50) score += 30;
    else if (employees >= 5 && employees <= 100) score += 15;
  }

  if (AGENCY_KEYWORDS.test(combined)) score += 30;

  return Math.min(100, score);
}

export function meetsIcpConfidence(confidenceScore: number | null, icpFitScore: number): boolean {
  const confidence = confidenceScore ?? 0;
  return confidence > 80 && icpFitScore >= 60;
}

export function compositeScore(confidenceScore: number | null, icpFitScore: number): number {
  const confidence = confidenceScore ?? 0;
  return Math.round(((confidence + icpFitScore) / 2) * 100) / 100;
}

/** Keep top N% of ranked candidates (minimum 1 when pool is non-empty). */
export function topPercentCutoff<T>(ranked: T[], topFraction: number): T[] {
  if (ranked.length === 0) return [];
  const keep = Math.max(1, Math.ceil(ranked.length * topFraction));
  return ranked.slice(0, keep);
}

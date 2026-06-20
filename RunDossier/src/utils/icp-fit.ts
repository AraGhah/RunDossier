/** Rule-based ICP fit for cold-email / outbound-agency buyers. */

const ICP_TITLE_PATTERNS = [
  /\bfounder\b/i,
  /\bco-?founder\b/i,
  /\bceo\b/i,
  /\bowner\b/i,
  /\bmanaging director\b/i,
  /\bhead of (outbound|growth|sales)\b/i,
  /\bhead of outbound\b/i,
  /\bvp\s+sales\b/i,
  /\bvice president\b.*\bsales\b/i,
  /\bdirector\b.*\b(business development|outbound|sales)\b/i,
  /\boutbound\b.*\b(lead|head|director)\b/i,
];

const AGENCY_KEYWORDS =
  /\b(cold email|cold-email|outbound lead|lead gen|lead generation|appointment setting|sdr.?as.?a.?service|outbound agency|sales agency|b2b agency|done.?for.?you outbound|outbound growth)\b/i;

const EXCLUDED_TITLE_OR_COMPANY =
  /\b(recruiter|recruiting|staffing|freelance consultant|software only|saas tool|marketing agency only)\b/i;

const GENERIC_MARKETING_ONLY =
  /\b(seo agency|social media agency|branding agency|creative agency)\b/i;

export interface IcpFitInput {
  title: string;
  company?: string;
  employeeCount?: number | null;
  researchSummary?: string;
}

export function isExcludedIcpLead(input: IcpFitInput): boolean {
  const combined = `${input.title ?? ''} ${input.company ?? ''} ${input.researchSummary ?? ''}`;
  if (EXCLUDED_TITLE_OR_COMPANY.test(combined)) return true;
  if (GENERIC_MARKETING_ONLY.test(combined) && !AGENCY_KEYWORDS.test(combined)) return true;
  return false;
}

/** Minimum score for W1 intake of cold-email agency leads. */
export function meetsColdEmailAgencyIcp(input: IcpFitInput, minScore = 50): boolean {
  if (isExcludedIcpLead(input)) return false;
  return scoreIcpFit(input) >= minScore;
}

export function icpFitReason(input: IcpFitInput): string {
  const parts: string[] = [];
  const title = (input.title ?? '').trim();
  const company = (input.company ?? '').trim();
  if (ICP_TITLE_PATTERNS.some((re) => re.test(title))) parts.push('decision-maker title');
  if (AGENCY_KEYWORDS.test(`${title} ${company} ${input.researchSummary ?? ''}`)) {
    parts.push('cold-email/outbound agency signals');
  }
  const employees = input.employeeCount;
  if (employees != null && employees >= 5 && employees <= 100) {
    parts.push(`agency size (${employees} employees)`);
  }
  return parts.length > 0 ? parts.join('; ') : 'ICP match pending research';
}

export function scoreIcpFit(input: IcpFitInput): number {
  const title = (input.title ?? '').trim();
  const company = (input.company ?? '').trim();
  const summary = (input.researchSummary ?? '').trim();
  const combined = `${title} ${company} ${summary}`;

  if (isExcludedIcpLead(input)) return 0;

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

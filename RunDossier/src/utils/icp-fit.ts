/** Rule-based ICP fit for cold-email / outbound-agency buyers. */

export type IcpSegment = 'agency_main' | 'consulting';

const ICP_TITLE_PATTERNS = [
  /\bfounder\b/i,
  /\bco-?founder\b/i,
  /\bceo\b/i,
  /\bowner\b/i,
  /\bmanaging director\b/i,
  /\bmanaging partner\b/i,
  /\bpartner\b/i,
  /\bprincipal\b/i,
  /\bhead of (outbound|growth|sales)\b/i,
  /\bvp\s+sales\b/i,
  /\bvice president\b.*\bsales\b/i,
  /\bdirector\b.*\b(business development|outbound|sales)\b/i,
  /\boutbound\b.*\b(lead|head|director)\b/i,
];

const AGENCY_KEYWORDS =
  /\b(cold[\s-]?email|outbound lead|lead[\s-]?gen|lead generation|appointment setting|sdr[\s-]?as[\s-]?a[\s-]?service|outbound agency|sales agency|b2b agency|done[\s-]?for[\s-]?you outbound|outbound growth|email marketing|demand[\s-]?gen|demand generation|pipeline agency|prospecting agency)\b/i;

const CONSULTING_KEYWORDS =
  /\b(gtm|go[\s-]?to[\s-]?market|outbound consultant|revenue consultant|demand[\s-]?gen consultant|sales development consultant|cold[\s-]?email consultant|pipeline consultant|fractional cro|fractional cmo|appointment setting consultant|outbound advisory|revenue advisory)\b/i;

const EXCLUDED_TITLE_OR_COMPANY =
  /\b(recruiter|recruiting|staffing|copywriter|copywriting|freelance consultant|freelancer|software only|saas tool|virtual assistant|va agency|in[\s-]?house marketer|in[\s-]?house marketing|employee at)\b/i;

const COACH_MENTOR =
  /\b(coach|coaching|mentor|mentoring|life coach|executive coach|career coach)\b/i;

const GENERIC_MARKETING_ONLY =
  /\b(seo agency|social media agency|branding agency|creative agency|pr agency|public relations agency)\b/i;

const GENERIC_CONSULTING_ONLY =
  /\b(management consulting|strategy consulting|it consulting|hr consulting|human resources consulting)\b/i;

export interface IcpFitInput {
  title: string;
  company?: string;
  employeeCount?: number | null;
  researchSummary?: string;
}

function combinedText(input: IcpFitInput): string {
  return `${input.title ?? ''} ${input.company ?? ''} ${input.researchSummary ?? ''}`.trim();
}

export function isExcludedIcpLead(input: IcpFitInput, segment: IcpSegment = 'agency_main'): boolean {
  const combined = combinedText(input);
  if (EXCLUDED_TITLE_OR_COMPANY.test(combined)) return true;
  if (COACH_MENTOR.test(combined)) return true;
  if (GENERIC_MARKETING_ONLY.test(combined) && !AGENCY_KEYWORDS.test(combined)) return true;

  if (segment === 'agency_main') {
    if (GENERIC_CONSULTING_ONLY.test(combined) && !AGENCY_KEYWORDS.test(combined)) return true;
    if (/\bconsulting\b/i.test(combined) && !AGENCY_KEYWORDS.test(combined)) return true;
  }

  if (segment === 'consulting') {
    if (GENERIC_CONSULTING_ONLY.test(combined) && !CONSULTING_KEYWORDS.test(combined) && !AGENCY_KEYWORDS.test(combined)) {
      return true;
    }
  }

  return false;
}

export function meetsIcpForSegment(
  input: IcpFitInput,
  segment: IcpSegment = 'agency_main',
  minScore = 50
): boolean {
  if (isExcludedIcpLead(input, segment)) return false;
  return scoreIcpFit(input, segment) >= minScore;
}

/** Minimum score for W1 intake of cold-email agency leads. */
export function meetsColdEmailAgencyIcp(input: IcpFitInput, minScore = 50): boolean {
  return meetsIcpForSegment(input, 'agency_main', minScore);
}

export function meetsConsultingIcp(input: IcpFitInput, minScore = 50): boolean {
  return meetsIcpForSegment(input, 'consulting', minScore);
}

export function icpFitReason(input: IcpFitInput, segment: IcpSegment = 'agency_main'): string {
  const parts: string[] = [];
  const title = (input.title ?? '').trim();
  const company = (input.company ?? '').trim();
  const combined = combinedText(input);

  if (ICP_TITLE_PATTERNS.some((re) => re.test(title))) parts.push('decision-maker title');
  if (segment === 'consulting' && CONSULTING_KEYWORDS.test(combined)) {
    parts.push('GTM/outbound consulting signals');
  }
  if (AGENCY_KEYWORDS.test(combined)) parts.push('cold-email/outbound agency signals');

  const employees = input.employeeCount;
  if (employees != null && employees >= 5 && employees <= 100) {
    parts.push(`agency size (${employees} employees)`);
  }
  return parts.length > 0 ? parts.join('; ') : 'ICP match pending research';
}

export function scoreIcpFit(input: IcpFitInput, segment: IcpSegment = 'agency_main'): number {
  const title = (input.title ?? '').trim();
  const company = (input.company ?? '').trim();
  const combined = combinedText(input);

  if (isExcludedIcpLead(input, segment)) return 0;

  let score = 0;

  if (ICP_TITLE_PATTERNS.some((re) => re.test(title))) {
    score += 40;
  } else if (/\b(outbound|sales|growth|revenue|gtm)\b/i.test(title)) {
    score += 20;
  }

  const employees = input.employeeCount;
  if (employees != null) {
    if (segment === 'consulting') {
      if (employees >= 1 && employees <= 25) score += 25;
      else if (employees <= 50) score += 15;
    } else if (employees >= 10 && employees <= 50) {
      score += 30;
    } else if (employees >= 5 && employees <= 100) {
      score += 15;
    }
  }

  if (AGENCY_KEYWORDS.test(combined)) score += 30;
  if (segment === 'consulting' && CONSULTING_KEYWORDS.test(combined)) score += 25;

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

export function parseProfileSegment(profileName: string): IcpSegment {
  if (/\bconsult(ing|ant)s?\b/i.test(profileName)) return 'consulting';
  return 'agency_main';
}

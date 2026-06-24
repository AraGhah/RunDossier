/**
 * Classify LLM/provider failures so the pipeline can RETRY transient outages
 * (billing/credit exhaustion, rate limits, 5xx, network blips) instead of
 * permanently dead-lettering prospects.
 *
 * Why this exists: the QA judge (Gemini) and generation (Anthropic) can fail for
 * reasons that resolve on their own (or when the user tops up credits). Treating
 * those as terminal silently shrinks a 1,000-prospect batch. Pure + unit-tested.
 */
export type ProviderErrorKind = 'transient' | 'permanent' | 'unknown';

/** Resolve-on-retry failures — outages, throttling, billing depletion, network. */
const TRANSIENT_PATTERNS: RegExp[] = [
  /prepayment credits? (are )?depleted/i,
  /credits? (are )?depleted/i,
  /billing/i,
  /\bquota\b/i,
  /resource[_\s-]?exhausted/i,
  /rate[_\s-]?limit/i,
  /too many requests/i,
  /\b429\b/,
  /overloaded/i,
  /\bunavailable\b/i,
  /service unavailable/i,
  /\b50[0234]\b/,
  /\btimed?[_\s-]?out\b/i,
  /etimedout/i,
  /econnreset/i,
  /econnrefused/i,
  /eai_again/i,
  /socket hang ?up/i,
  /fetch failed/i,
  /\bnetwork\b/i,
  /temporar(y|ily)/i,
  /try again/i,
];

/** Won't fix by retrying — auth, permissions, bad model id. */
const PERMANENT_PATTERNS: RegExp[] = [
  /api[_\s-]?key not valid/i,
  /invalid api key/i,
  /\b401\b/,
  /\b403\b/,
  /\bunauthorized\b/i,
  /permission denied/i,
  /\b404\b/,
  /model .*not found/i,
];

export function providerErrorMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message ?? '';
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function classifyProviderError(err: unknown): ProviderErrorKind {
  const msg = providerErrorMessage(err);
  if (!msg) return 'unknown';
  // Permanent wins over transient when both appear (e.g. a 403 that mentions "quota").
  if (PERMANENT_PATTERNS.some((re) => re.test(msg))) return 'permanent';
  if (TRANSIENT_PATTERNS.some((re) => re.test(msg))) return 'transient';
  return 'unknown';
}

export function isTransientProviderError(err: unknown): boolean {
  return classifyProviderError(err) === 'transient';
}

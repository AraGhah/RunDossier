import { config } from '../config.js';

export type ApifyFailureKind =
  | 'bad_input'
  | 'rate_limit'
  | 'auth'
  | 'actor_failed'
  | 'empty_dataset'
  | 'timeout'
  | 'parsing'
  | 'unknown';

export interface ApifyErrorContext {
  actorId: string;
  status?: string;        // Apify run status, e.g. FAILED / TIMED-OUT / ABORTED
  statusMessage?: string; // Apify run status message
  runId?: string;         // actor run id (for the Apify console)
  datasetId?: string;     // default dataset id
  httpStatus?: number;    // HTTP status from the API call, when available
  cause?: string;         // underlying error message
}

/** Redact tokens/secrets so they never reach logs or failed_jobs. */
export function redactSecrets(text: string, token = config.apifyToken): string {
  let out = text ?? '';
  if (token && token.length > 6) out = out.split(token).join('***');
  out = out.replace(/apify_api_[A-Za-z0-9]+/g, 'apify_api_***');
  out = out.replace(/(token["':=\s]+)[A-Za-z0-9._-]+/gi, '$1***');
  return out;
}

/**
 * Classify an Apify failure from whatever signals are available so the real
 * cause (bad input, rate limit, auth, actor failure, empty dataset, timeout,
 * parsing) is visible rather than a bare "(FAILED)".
 */
export function classifyApifyFailure(parts: {
  status?: string;
  statusMessage?: string;
  errorMessage?: string;
  httpStatus?: number;
}): ApifyFailureKind {
  const blob = `${parts.status ?? ''} ${parts.statusMessage ?? ''} ${parts.errorMessage ?? ''}`.toLowerCase();
  const code = parts.httpStatus;

  if (code === 401 || code === 403 || /unauthor|forbidden|invalid token|authentication|not approved|approve its permissions/.test(blob)) {
    return 'auth';
  }
  if (code === 429 || /rate limit|run limit|free user run limit|quota|too many requests/.test(blob)) {
    return 'rate_limit';
  }
  if (parts.status === 'TIMED-OUT' || parts.status === 'TIMEOUT' || /timed[ -]?out|timeout/.test(blob)) {
    return 'timeout';
  }
  if (code === 400 || /invalid input|bad request|input is invalid|schema|validation/.test(blob)) {
    return 'bad_input';
  }
  if (/no .*(profile|results?|items?).*(returned|found)|empty dataset|0 items|returned no items/.test(blob)) {
    return 'empty_dataset';
  }
  if (/json|parse|unexpected token/.test(blob)) {
    return 'parsing';
  }
  if (parts.status === 'FAILED' || parts.status === 'ABORTED' || /actor.*fail|run failed/.test(blob)) {
    return 'actor_failed';
  }
  return 'unknown';
}

/**
 * Rich Apify error carrying structured debugging context. The message is
 * secret-redacted and includes the run id + dataset id so a failed run can be
 * found in the Apify console.
 */
export class ApifyScrapeError extends Error {
  readonly kind: ApifyFailureKind;
  readonly context: ApifyErrorContext;

  constructor(kind: ApifyFailureKind, context: ApifyErrorContext) {
    const parts = [
      `Apify scrape failed [${kind}] actor=${context.actorId}`,
      context.status ? `status=${context.status}` : '',
      context.httpStatus ? `http=${context.httpStatus}` : '',
      context.runId ? `runId=${context.runId}` : '',
      context.datasetId ? `datasetId=${context.datasetId}` : '',
      context.statusMessage ? `statusMessage=${redactSecrets(context.statusMessage)}` : '',
      context.cause ? `cause=${redactSecrets(context.cause)}` : '',
    ].filter(Boolean);
    super(parts.join(' '));
    this.name = 'ApifyScrapeError';
    this.kind = kind;
    this.context = context;
  }
}

/** Pull an HTTP status code off an apify-client error if present. */
export function httpStatusFromError(err: unknown): number | undefined {
  const e = err as { statusCode?: number; status?: number; response?: { status?: number } };
  return e?.statusCode ?? e?.status ?? e?.response?.status;
}

/** Build an ApifyScrapeError from a thrown error (e.g. the .call() rejected). */
export function apifyErrorFromThrown(actorId: string, err: unknown): ApifyScrapeError {
  const cause = err instanceof Error ? err.message : String(err);
  const httpStatus = httpStatusFromError(err);
  const kind = classifyApifyFailure({ errorMessage: cause, httpStatus });
  return new ApifyScrapeError(kind, { actorId, httpStatus, cause });
}

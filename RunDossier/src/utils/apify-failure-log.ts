import { ApifyScrapeError, redactSecrets, type ApifyFailureKind } from './apify-error.js';

export interface ApifyFailureRecord {
  workflow: string;
  entityId: string;
  kind: ApifyFailureKind;
  message: string;
  retryCount: number;
}

/**
 * Build a structured, secret-redacted failed_jobs error string for Apify failures.
 */
export function formatApifyFailureForDb(
  err: unknown,
  opts: { workflow: string; entityId: string; retryCount?: number; requestType?: string }
): ApifyFailureRecord {
  if (err instanceof ApifyScrapeError) {
    const ctx = err.context;
    const parts = [
      `kind=${err.kind}`,
      `actor=${ctx.actorId}`,
      ctx.httpStatus ? `http=${ctx.httpStatus}` : '',
      ctx.runId ? `runId=${ctx.runId}` : '',
      ctx.datasetId ? `datasetId=${ctx.datasetId}` : '',
      ctx.status ? `status=${ctx.status}` : '',
      opts.requestType ? `request=${opts.requestType}` : '',
      ctx.statusMessage ? `statusMessage=${redactSecrets(ctx.statusMessage)}` : '',
      ctx.cause ? `cause=${redactSecrets(ctx.cause)}` : '',
    ].filter(Boolean);
    return {
      workflow: opts.workflow,
      entityId: opts.entityId,
      kind: err.kind,
      message: redactSecrets(parts.join(' | ')),
      retryCount: opts.retryCount ?? 0,
    };
  }

  const message = redactSecrets(err instanceof Error ? err.message : String(err));
  return {
    workflow: opts.workflow,
    entityId: opts.entityId,
    kind: 'unknown',
    message,
    retryCount: opts.retryCount ?? 0,
  };
}

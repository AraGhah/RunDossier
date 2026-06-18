interface IdempotencyRecord {
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, IdempotencyRecord>();

/** In-memory idempotency store for POST handlers (pilot submit). Use Redis in multi-instance prod. */
export function getIdempotentResponse(key: string): IdempotencyRecord | undefined {
  const record = store.get(key);
  if (!record) return undefined;
  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return record;
}

export function setIdempotentResponse(
  key: string,
  statusCode: number,
  body: unknown,
  ttlMs = 24 * 60 * 60_000,
): void {
  store.set(key, { statusCode, body, expiresAt: Date.now() + ttlMs });
}

export function idempotencyKeyFromRequest(header: string | string[] | undefined): string {
  const raw = Array.isArray(header) ? header[0] : header;
  return typeof raw === 'string' ? raw.trim().slice(0, 128) : '';
}

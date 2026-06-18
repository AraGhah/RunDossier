import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getIdempotentResponse, setIdempotentResponse } from './idempotency.js';

describe('idempotency store', () => {
  it('returns stored response for same key', () => {
    setIdempotentResponse('key-1', 201, { ok: true });
    const hit = getIdempotentResponse('key-1');
    assert.equal(hit?.statusCode, 201);
    assert.deepEqual(hit?.body, { ok: true });
  });
});

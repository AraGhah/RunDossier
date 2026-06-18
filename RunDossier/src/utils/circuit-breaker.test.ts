import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from './circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('opens after repeated failures', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetMs: 60_000, name: 'test' });
    const fail = () => Promise.reject(new Error('down'));

    await assert.rejects(() => breaker.exec(fail));
    await assert.rejects(() => breaker.exec(fail));
    assert.equal(breaker.getState(), 'open');

    await assert.rejects(() => breaker.exec(fail));
  });

  it('uses fallback when open', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetMs: 60_000 });
    await assert.rejects(() => breaker.exec(() => Promise.reject(new Error('fail'))));
    const value = await breaker.exec(() => Promise.reject(new Error('fail')), () => 'ok');
    assert.equal(value, 'ok');
  });
});

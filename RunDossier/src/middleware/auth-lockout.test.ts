import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  AUTH_LOCKOUT_MAX_FAILURES,
  clearAuthFailures,
  isAuthLocked,
  recordAuthFailure,
  resetAuthLockoutStore,
} from '../middleware/auth-lockout.js';

describe('auth-lockout', () => {
  beforeEach(() => {
    resetAuthLockoutStore();
  });

  it('locks after max failures', () => {
    const key = '203.0.113.1';
    for (let i = 0; i < AUTH_LOCKOUT_MAX_FAILURES - 1; i++) {
      const result = recordAuthFailure(key);
      assert.equal(result.locked, false);
    }
    const locked = recordAuthFailure(key);
    assert.equal(locked.locked, true);
    assert.ok((locked.retryAfterSec ?? 0) > 0);
    assert.equal(isAuthLocked(key).locked, true);
  });

  it('clears failures on success path', () => {
    const key = '203.0.113.2';
    recordAuthFailure(key);
    clearAuthFailures(key);
    assert.equal(isAuthLocked(key).locked, false);
  });
});

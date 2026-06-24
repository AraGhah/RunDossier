import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCHEDULER_PERSONALIZE_RETRIES,
  shouldSchedulerRetryPersonalize,
} from './personalize-retry.js';

describe('shouldSchedulerRetryPersonalize', () => {
  it('blocks when dead-letter exists', () => {
    assert.equal(shouldSchedulerRetryPersonalize(0, true), false);
  });

  it('allows up to MAX retries', () => {
    assert.equal(shouldSchedulerRetryPersonalize(0, false), true);
    assert.equal(shouldSchedulerRetryPersonalize(MAX_SCHEDULER_PERSONALIZE_RETRIES - 1, false), true);
    assert.equal(shouldSchedulerRetryPersonalize(MAX_SCHEDULER_PERSONALIZE_RETRIES, false), false);
  });
});

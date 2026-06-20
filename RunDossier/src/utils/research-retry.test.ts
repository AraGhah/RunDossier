import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isTerminalResearchError,
  shouldSchedulerRetryResearch,
  MAX_SCHEDULER_RESEARCH_RETRIES,
} from './research-retry.js';

describe('isTerminalResearchError', () => {
  it('detects terminal Apify kinds', () => {
    assert.equal(isTerminalResearchError('kind=auth | actor=xyz'), true);
    assert.equal(isTerminalResearchError('kind=empty_dataset | actor=xyz'), true);
    assert.equal(isTerminalResearchError('kind=bad_input'), true);
  });

  it('allows transient kinds', () => {
    assert.equal(isTerminalResearchError('kind=timeout | actor=xyz'), false);
    assert.equal(isTerminalResearchError('kind=actor_failed'), false);
  });

  it('detects terminal plain messages', () => {
    assert.equal(isTerminalResearchError('No LinkedIn profile returned for url'), true);
    assert.equal(isTerminalResearchError('free user run limit exceeded'), true);
  });
});

describe('shouldSchedulerRetryResearch', () => {
  it('stops after max retries', () => {
    assert.equal(
      shouldSchedulerRetryResearch(MAX_SCHEDULER_RESEARCH_RETRIES, 'kind=timeout'),
      false
    );
  });

  it('skips terminal errors even under retry cap', () => {
    assert.equal(shouldSchedulerRetryResearch(1, 'kind=auth'), false);
  });

  it('retries transient errors under cap', () => {
    assert.equal(shouldSchedulerRetryResearch(2, 'kind=timeout'), true);
  });
});

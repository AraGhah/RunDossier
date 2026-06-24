import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldDeliverParentBatch,
  shouldRunDelivery,
  resolveParentBatchCompletion,
  emptyBatchCounts,
  type ParentBatchProgress,
} from './batch-progress.js';

function progress(overrides: Partial<Omit<ParentBatchProgress, 'counts'>> & { counts?: Partial<ParentBatchProgress['counts']> }): ParentBatchProgress {
  const { counts: countOverrides, ...rest } = overrides;
  return {
    requested: 1000,
    imported: 100,
    sourceExhausted: false,
    replacementUsed: false,
    counts: { ...emptyBatchCounts(), ...countOverrides },
    ...rest,
  };
}

describe('shouldRunDelivery (legacy client gate)', () => {
  it('delivers only when ready and pipeline idle', () => {
    assert.equal(shouldRunDelivery(0, 3), true);
    assert.equal(shouldRunDelivery(2, 3), false);
    assert.equal(shouldRunDelivery(0, 0), false);
  });
});

describe('shouldDeliverParentBatch', () => {
  it('blocks delivery while prospects are still queued', () => {
    const p = progress({ counts: { queued: 50, personalized_qa_passed: 44 } });
    assert.equal(shouldDeliverParentBatch(p), false);
  });

  it('blocks delivery while retryable failures remain', () => {
    const p = progress({ counts: { research_failed: 2, personalized_qa_passed: 44 } });
    assert.equal(shouldDeliverParentBatch(p), false);
  });

  it('allows delivery when enough QA-passed prospects fulfill the request', () => {
    const p = progress({
      requested: 100,
      counts: { personalized_qa_passed: 100, thin_research: 13 },
    });
    assert.equal(shouldDeliverParentBatch(p), true);
  });

  it('does NOT deliver early when only 44 of 1000 are ready', () => {
    const p = progress({
      requested: 1000,
      imported: 57,
      counts: { personalized_qa_passed: 44, thin_research: 13 },
      sourceExhausted: false,
    });
    assert.equal(shouldDeliverParentBatch(p), false);
  });

  it('allows partial delivery when source exhausted and all imported terminal', () => {
    const p = progress({
      requested: 1000,
      imported: 57,
      counts: { personalized_qa_passed: 44, thin_research: 13 },
      sourceExhausted: true,
    });
    assert.equal(shouldDeliverParentBatch(p), true);
  });
});

describe('resolveParentBatchCompletion', () => {
  it('marks fully complete when delivered count meets request', () => {
    const p = progress({
      requested: 100,
      counts: { personalized_qa_passed: 100 },
    });
    const r = resolveParentBatchCompletion(p);
    assert.equal(r.fullyComplete, true);
    assert.equal(r.status, 'completed');
  });

  it('marks partial when source exhausted below target', () => {
    const p = progress({
      requested: 1000,
      counts: { personalized_qa_passed: 44, thin_research: 13 },
      sourceExhausted: true,
    });
    const r = resolveParentBatchCompletion(p);
    assert.equal(r.fullyComplete, false);
    assert.equal(r.status, 'partial');
    assert.match(r.reason ?? '', /exhausted/i);
  });
});

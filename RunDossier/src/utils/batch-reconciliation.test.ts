import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileDeliveryCounts } from './batch-reconciliation.js';
import { emptyBatchCounts } from './batch-progress.js';

describe('reconcileDeliveryCounts', () => {
  it('rejects duplicate prospect IDs in claim', () => {
    const counts = emptyBatchCounts();
    counts.personalized_qa_passed = 5;
    const r = reconcileDeliveryCounts({
      parentBatchId: 'pb-1',
      requested: 100,
      claimedIds: ['a', 'a', 'b'],
      counts,
      sourceExhausted: false,
    });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(' '), /Duplicate/);
  });

  it('rejects CSV row mismatch', () => {
    const counts = emptyBatchCounts();
    counts.personalized_qa_passed = 3;
    const r = reconcileDeliveryCounts({
      parentBatchId: 'pb-1',
      requested: 100,
      claimedIds: ['a', 'b', 'c'],
      counts,
      csvRowCount: 2,
      sourceExhausted: true,
    });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(' '), /CSV row count/);
  });

  it('passes when counts align', () => {
    const counts = emptyBatchCounts();
    counts.personalized_qa_passed = 100;
    const ids = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    const r = reconcileDeliveryCounts({
      parentBatchId: 'pb-1',
      requested: 100,
      claimedIds: ids,
      counts,
      csvRowCount: 100,
      deliveryLedgerCount: 100,
      sourceExhausted: true,
    });
    assert.equal(r.ok, true);
    assert.equal(r.summary.claimed, 100);
  });
});

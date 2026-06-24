import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSendOutcome } from '../jobs/delivery.job.js';
import { reconcileDeliveryCounts } from './batch-reconciliation.js';
import { emptyBatchCounts, shouldDeliverParentBatch } from './batch-progress.js';

describe('failure scenarios — delivery and reconciliation', () => {
  it('Gmail send failure does not finalize (retry next cycle)', () => {
    const outcome = resolveSendOutcome({ ok: false, skipped: false });
    assert.equal(outcome.finalize, false);
    assert.equal(outcome.deliveryStatus, 'email_failed');
  });

  it('reconciliation blocks empty claim', () => {
    const r = reconcileDeliveryCounts({
      parentBatchId: 'pb',
      requested: 100,
      claimedIds: [],
      counts: emptyBatchCounts(),
      sourceExhausted: true,
    });
    assert.equal(r.ok, false);
  });

  it('thin_research prospects do not open delivery gate while others queued', () => {
    const counts = emptyBatchCounts();
    counts.thin_research = 13;
    counts.personalized_qa_passed = 44;
    assert.equal(
      shouldDeliverParentBatch({
        requested: 1000,
        imported: 57,
        sourceExhausted: false,
        replacementUsed: false,
        counts,
      }),
      false
    );
  });

  it('source exhaustion allows partial delivery when all imported terminal', () => {
    const counts = emptyBatchCounts();
    counts.thin_research = 200;
    counts.personalized_qa_passed = 800;
    assert.equal(
      shouldDeliverParentBatch({
        requested: 1000,
        imported: 1000,
        sourceExhausted: true,
        replacementUsed: true,
        counts,
      }),
      true
    );
  });
});

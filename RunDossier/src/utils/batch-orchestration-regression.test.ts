import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldDeliverParentBatch, emptyBatchCounts } from './batch-progress.js';
import { planDelivery, resolveSendOutcome } from '../jobs/delivery.job.js';

describe('batch orchestration regression (delivery 7f24965b scenario)', () => {
  it('reproduces the failure: 44 delivered + 13 thin must NOT complete a 1000 batch', () => {
    const counts = emptyBatchCounts();
    counts.personalized_qa_passed = 44;
    counts.thin_research = 13;

    assert.equal(
      shouldDeliverParentBatch({
        requested: 1000,
        imported: 57,
        sourceExhausted: false,
        replacementUsed: false,
        counts,
      }),
      false,
      'Must not treat first internal chunk as complete batch'
    );
  });

  it('allows delivery only after 1000 QA-passed or source exhausted', () => {
    const ready = emptyBatchCounts();
    ready.personalized_qa_passed = 1000;
    assert.equal(
      shouldDeliverParentBatch({
        requested: 1000,
        imported: 1200,
        sourceExhausted: false,
        replacementUsed: true,
        counts: ready,
      }),
      true
    );
  });

  it('email send failure does not finalize (retry next cycle)', () => {
    assert.deepEqual(resolveSendOutcome({ ok: false }), {
      finalize: false,
      deliveryStatus: 'email_failed',
    });
  });

  it('internal-only still plans correctly', () => {
    assert.deepEqual(
      planDelivery({ deliverableCount: 0, internalCount: 4, hasRecipient: true }),
      { action: 'internal_only' }
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldSendDigest } from './pipeline-digest.job.js';

describe('shouldSendDigest', () => {
  const idle = {
    newProspects: 0,
    searchLeads: 0,
    searchIngested: 0,
    researchedLastHour: 0,
    qaPassedLastHour: 0,
    deliveredLastHour: 0,
    recentFailureCount: 0,
    readyToDeliver: 0,
    pipelineActive: 0,
  };

  it('skips digest when pipeline is completely idle', () => {
    assert.equal(shouldSendDigest(idle), false);
  });

  it('stays quiet on standing pipeline state alone (no recent activity)', () => {
    // Leftover prospects sitting in a non-terminal status must NOT trigger an
    // hourly ping — that was the spurious "every hour even when idle" bug.
    assert.equal(shouldSendDigest({ ...idle, readyToDeliver: 3 }), false);
    assert.equal(shouldSendDigest({ ...idle, pipelineActive: 7 }), false);
  });

  it('sends when a prospect was actually delivered this cycle', () => {
    assert.equal(shouldSendDigest({ ...idle, deliveredLastHour: 2 }), true);
  });

  it('sends when delivery cycle had activity', () => {
    assert.equal(
      shouldSendDigest({
        ...idle,
        deliverySummary: { clientsProcessed: 1, prospectsDelivered: 5, details: [], errors: [] },
      }),
      true
    );
  });

  it('sends when recent failures exist', () => {
    assert.equal(shouldSendDigest({ ...idle, recentFailureCount: 1 }), true);
  });
});

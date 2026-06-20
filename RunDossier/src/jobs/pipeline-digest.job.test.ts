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

  it('sends when prospects are ready to deliver', () => {
    assert.equal(shouldSendDigest({ ...idle, readyToDeliver: 3 }), true);
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

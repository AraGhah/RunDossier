import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRunDelivery } from './delivery-trigger.js';

describe('shouldRunDelivery — retryable failures do not block', () => {
  it('delivers when only qa_failed prospects remain (not pipeline-active)', () => {
    assert.equal(shouldRunDelivery(0, 3), true);
  });

  it('blocks when prospects are actively in pipeline', () => {
    assert.equal(shouldRunDelivery(1, 3), false);
  });
});

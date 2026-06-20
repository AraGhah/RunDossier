import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RESEARCH_RETRIGGER_ALLOWED,
  RESEARCH_RETRIGGER_BLOCKED,
  validateResearchRetriggerStatus,
} from '../services/prospect.service.js';

describe('validateResearchRetriggerStatus', () => {
  it('blocks delivered and in-progress statuses', () => {
    for (const status of RESEARCH_RETRIGGER_BLOCKED) {
      assert.throws(() => validateResearchRetriggerStatus(status), /Cannot re-research/);
    }
  });

  it('allows safe retry statuses', () => {
    for (const status of RESEARCH_RETRIGGER_ALLOWED) {
      assert.doesNotThrow(() => validateResearchRetriggerStatus(status));
    }
  });

  it('rejects unknown statuses', () => {
    assert.throws(() => validateResearchRetriggerStatus('unknown_status'), /Cannot re-research from status/);
  });
});

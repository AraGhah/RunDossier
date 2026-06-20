import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isWorkflowRunStale, STALE_WORKFLOW_RUN_MINUTES } from './workflow-run.js';

describe('isWorkflowRunStale', () => {
  it('marks runs older than threshold as stale', () => {
    const started = new Date('2026-01-01T00:00:00Z');
    const now = new Date(started.getTime() + (STALE_WORKFLOW_RUN_MINUTES + 1) * 60_000);
    assert.equal(isWorkflowRunStale(started, now), true);
  });

  it('keeps recent runs active', () => {
    const started = new Date();
    assert.equal(isWorkflowRunStale(started), false);
  });
});

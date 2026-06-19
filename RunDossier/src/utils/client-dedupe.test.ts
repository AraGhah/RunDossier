import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planClientDedupe, hasValidEmail } from './client-dedupe.js';

const A = { id: 'a', contact_email: null, prospects: 0, batches: 0 };
const B = { id: 'b', contact_email: null, prospects: 13, batches: 3 };
const C = { id: 'c', contact_email: 'ara@getdossier.co', prospects: 5, batches: 0 };

describe('hasValidEmail', () => {
  it('accepts a real email, rejects null/blank/malformed', () => {
    assert.equal(hasValidEmail({ id: 'x', contact_email: 'ara@getdossier.co' }), true);
    assert.equal(hasValidEmail({ id: 'x', contact_email: null }), false);
    assert.equal(hasValidEmail({ id: 'x', contact_email: '  ' }), false);
    assert.equal(hasValidEmail({ id: 'x', contact_email: 'nope' }), false);
  });
});

describe('planClientDedupe', () => {
  it('honors a preferred (canonical default) survivor and merges the rest', () => {
    const plan = planClientDedupe([A, B, C], 'b');
    assert.equal(plan.survivorId, 'b');
    assert.deepEqual(plan.mergeIds.sort(), ['a', 'c']);
  });

  it('without a preference, keeps the row with a valid email', () => {
    const plan = planClientDedupe([A, B, C]);
    assert.equal(plan.survivorId, 'c');
    assert.ok(!plan.mergeIds.includes('c')); // never merges/deletes the survivor
  });

  it('tie-breaks by most data when no row has an email', () => {
    const plan = planClientDedupe([A, B]);
    assert.equal(plan.survivorId, 'b');
  });

  it('never lists the survivor among the rows to delete', () => {
    const plan = planClientDedupe([A, B, C], 'b');
    assert.ok(!plan.mergeIds.includes(plan.survivorId));
  });

  it('refuses to run on fewer than 2 rows', () => {
    assert.throws(() => planClientDedupe([A]));
  });
});

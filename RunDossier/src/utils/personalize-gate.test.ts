import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assessPersonalizeGate, isModelRefusalText } from './personalize-gate.js';

describe('assessPersonalizeGate', () => {
  it('blocks null research', () => {
    const r = assessPersonalizeGate({ research_summary: null, top_3_signals: null });
    assert.equal(r.ok, false);
  });

  it('blocks thin summary with no signals', () => {
    const r = assessPersonalizeGate({
      research_summary: 'Short',
      top_3_signals: [],
      confidence_score: 90,
    });
    assert.equal(r.ok, false);
  });

  it('allows two verifiable signals', () => {
    const r = assessPersonalizeGate({
      research_summary:
        'Acme expanded outbound team in Q1 and launched a new partner program in EMEA.',
      top_3_signals: [
        { signal: 'Hired 3 new SDRs posted on LinkedIn last month', source: 'linkedin.com/in/acme', date: '2026-01-01' },
        { signal: 'Announced EMEA partner program on company blog', source: 'acme.com/blog', date: '2026-02-01' },
      ],
      confidence_score: 85,
    });
    assert.equal(r.ok, true);
  });
});

describe('isModelRefusalText', () => {
  it('detects refusal prose', () => {
    assert.equal(
      isModelRefusalText('I cannot generate grounded variants because signals are null.'),
      true
    );
  });
});

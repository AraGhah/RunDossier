import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyProgrammaticQAChecks,
  passesW45Criteria,
  pickBestVariant,
  type QABrief,
  type QAResult,
} from './qa.agent.js';
import type { FirstLineVariant } from './personalize.agent.js';

const brief: QABrief = {
  name: 'Jane Doe',
  title: 'VP Sales',
  company: 'Acme',
  research_summary: 'Acme hired three SDR managers in Austin in March 2025.',
  top_3_signals: [{ signal: 'SDR manager hires Austin March 2025', source: 'linkedin.com/jobs' }],
};

const goodVariant: FirstLineVariant = {
  variant_number: 1,
  signal_used: 'SDR manager hires Austin',
  subject: 're: sdr hires',
  opener: 'Saw the Austin SDR manager job posts from March.',
  bridge: 'Teams in that hiring phase usually hit a wall personalizing at volume.',
};

function baseQa(overrides: Partial<QAResult> = {}): QAResult {
  return {
    variant_number: 1,
    grounded: true,
    specificity_score: 8,
    human_ness_score: 8,
    relevance_score: 8,
    length_ok: true,
    qa_score: 8,
    qa_verdict: 'ship',
    qa_reason: 'strong',
    ...overrides,
  };
}

describe('passesW45Criteria', () => {
  it('requires relevance score at floor', () => {
    assert.equal(passesW45Criteria(baseQa({ relevance_score: 6 })), false);
    assert.equal(passesW45Criteria(baseQa({ relevance_score: 7 })), true);
  });

  it('rejects when verdict is reject', () => {
    assert.equal(passesW45Criteria(baseQa({ qa_verdict: 'reject' })), false);
  });
});

describe('applyProgrammaticQAChecks', () => {
  it('rejects banned phrases even if LLM scored high', () => {
    const result = applyProgrammaticQAChecks(goodVariant, baseQa(), brief);
    assert.equal(result.qa_verdict, 'ship');
  });

  it('rejects ungrounded signal_used', () => {
    const variant = { ...goodVariant, signal_used: 'IPO Q4 2026' };
    const result = applyProgrammaticQAChecks(variant, baseQa(), brief);
    assert.equal(result.grounded, false);
    assert.equal(result.qa_verdict, 'reject');
  });

  it('flags overlong opener+bridge but does not reject (soft check)', () => {
    const variant = {
      ...goodVariant,
      opener: Array(40).fill('word').join(' '),
      bridge: Array(20).fill('more').join(' '),
    };
    const result = applyProgrammaticQAChecks(variant, baseQa({ length_ok: true }), brief);
    assert.equal(result.length_ok, false);
    assert.equal(result.qa_verdict, 'ship');
  });
});

describe('pickBestVariant', () => {
  it('picks highest qa_score among passing variants', () => {
    const variants: FirstLineVariant[] = [
      { ...goodVariant, variant_number: 1 },
      { ...goodVariant, variant_number: 2, subject: 'austin hiring' },
    ];
    const qa: QAResult[] = [
      baseQa({ variant_number: 1, qa_score: 7 }),
      baseQa({ variant_number: 2, qa_score: 9 }),
    ];
    const pick = pickBestVariant(variants, qa);
    assert.equal(pick?.variant.variant_number, 2);
  });

  it('returns null when none pass', () => {
    const qa = [baseQa({ qa_verdict: 'reject', qa_score: 4 })];
    assert.equal(pickBestVariant([goodVariant], qa), null);
  });
});

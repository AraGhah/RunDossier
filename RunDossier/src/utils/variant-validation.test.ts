import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkSignalGrounding,
  countWords,
  formatSignalsForPrompt,
  hasBannedPhrase,
  validateVariantFields,
  validateVariantLength,
} from './variant-validation.js';

describe('countWords', () => {
  it('counts words in a sentence', () => {
    assert.equal(countWords('hello world'), 2);
    assert.equal(countWords('  one   two three  '), 3);
  });
});

describe('validateVariantLength', () => {
  it('accepts lines within limits', () => {
    const result = validateVariantLength(
      're: sdr hires',
      'Saw the Austin SDR job post last week.',
      'Teams hiring SDRs usually struggle to personalize at volume.'
    );
    assert.equal(result.length_ok, true);
  });

  it('rejects opener+bridge over 65 words', () => {
    const longOpener = Array(36).fill('word').join(' ');
    const result = validateVariantLength('quick note', longOpener, 'short bridge');
    assert.equal(result.length_ok, false);
    assert.ok(result.errors.some((e) => e.includes('opener')));
  });
});

describe('validateVariantFields', () => {
  it('rejects banned phrases', () => {
    const err = validateVariantFields('quick note', 'I noticed your recent growth.', 'We help companies scale.');
    assert.ok(err?.includes('banned'));
  });

  it('accepts a valid variant', () => {
    assert.equal(
      validateVariantFields(
        're: sdr hires',
        'Saw the Austin SDR job post last week.',
        'Teams hiring SDRs usually struggle to personalize at volume.'
      ),
      null
    );
  });
});

describe('checkSignalGrounding', () => {
  it('passes when signal tokens appear in brief', () => {
    const ok = checkSignalGrounding('Series B funding March 2025', {
      research_summary: 'Acme raised Series B in March 2025.',
      top_3_signals: [{ signal: 'Series B funding March 2025', source: 'techcrunch.com' }],
    });
    assert.equal(ok, true);
  });

  it('fails when signal is fabricated', () => {
    const ok = checkSignalGrounding('IPO announcement Q4 2026', {
      research_summary: 'Acme is a mid-size SaaS company.',
      top_3_signals: [{ signal: 'Hiring SDR managers', source: 'linkedin.com' }],
    });
    assert.equal(ok, false);
  });
});

describe('formatSignalsForPrompt', () => {
  it('formats structured signals', () => {
    const text = formatSignalsForPrompt([
      { signal: 'Hired 3 SDRs', source: 'linkedin.com/jobs/1', date: '2025-03-01' },
    ]);
    assert.match(text, /Signal 1/);
    assert.match(text, /Hired 3 SDRs/);
    assert.match(text, /linkedin.com/);
  });
});

describe('hasBannedPhrase', () => {
  it('detects extended banned list', () => {
    assert.equal(hasBannedPhrase('Just reaching out to connect.'), true);
    assert.equal(hasBannedPhrase('Saw the job post in Austin.'), false);
  });
});

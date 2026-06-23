import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripEmDashes } from './strip-emdash.js';

describe('stripEmDashes — truly removes dash punctuation', () => {
  it('replaces em-dashes with a comma (no dash left behind)', () => {
    const out = stripEmDashes('Eight years holding dual roles — means you systematized something');
    assert.equal(out, 'Eight years holding dual roles, means you systematized something');
    assert.ok(!out.includes('—') && !out.includes(' - '));
  });

  it('replaces en-dashes', () => {
    assert.equal(stripEmDashes('70+ demos/month – that number travels'), '70+ demos/month, that number travels');
  });

  it('replaces a spaced hyphen used as a dash', () => {
    assert.equal(stripEmDashes('scaled to $82k MRR - then exited'), 'scaled to $82k MRR, then exited');
  });

  it('preserves hyphens inside words', () => {
    assert.equal(stripEmDashes('data-driven, founder-led, co-founder'), 'data-driven, founder-led, co-founder');
  });

  it('drops a leading dash and trims', () => {
    assert.equal(stripEmDashes('— looks like you are scaling fast'), 'looks like you are scaling fast');
  });

  it('does not leave double spaces or trailing commas', () => {
    const out = stripEmDashes('a — b — c');
    assert.equal(out, 'a, b, c');
    assert.ok(!/\s{2,}/.test(out));
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateMergeFields,
  extractMergeFields,
  validateTemplateFields,
  isGenericApolloOpener,
  validateOpenerProvenance,
  validateCampaignProspect,
} from './merge-fields.js';

describe('Part 9 #4 — a campaign cannot activate when merge fields are missing', () => {
  it('flags a missing required field', () => {
    const r = validateMergeFields({ first_name: 'Ara', company: 'Dossier', subject_line_a: 'hi' });
    assert.equal(r.ok, false);
    assert.ok(r.missing.includes('personalized_opener'));
  });
  it('flags an empty required field', () => {
    const r = validateMergeFields({
      first_name: 'Ara',
      company: 'Dossier',
      personalized_opener: '   ',
      subject_line_a: 'hi',
    });
    assert.equal(r.ok, false);
    assert.ok(r.empty.includes('personalized_opener'));
  });
  it('accepts a complete field set', () => {
    const r = validateMergeFields({
      first_name: 'Ara',
      company: 'Dossier',
      personalized_opener: 'Saw the SDR job post in Austin.',
      subject_line_a: 'quick note',
    });
    assert.equal(r.ok, true);
  });
});

describe('unsupported merge fields are rejected', () => {
  it('flags unknown variables passed as data', () => {
    const r = validateMergeFields({
      first_name: 'Ara',
      company: 'Dossier',
      personalized_opener: 'x',
      subject_line_a: 'y',
      sneaky_field: 'z',
    });
    assert.ok(r.unsupported.includes('sneaky_field'));
    assert.equal(r.ok, false);
  });
  it('flags unsupported variables in a template body', () => {
    assert.deepEqual(extractMergeFields('Hi {{first_name}}, {{ unknown_var }}!').sort(), [
      'first_name',
      'unknown_var',
    ]);
    const v = validateTemplateFields('Hi {{first_name}} at {{company}} — {{unknown_var}}');
    assert.equal(v.ok, false);
    assert.deepEqual(v.unsupported, ['unknown_var']);
  });
});

describe('Part 8 — generic Apollo AI openers are disallowed; Dossier opener must be sourced', () => {
  it('detects a generic Apollo AI opener', () => {
    assert.equal(isGenericApolloOpener({ opener_source: 'apollo_ai' }), true);
    assert.equal(isGenericApolloOpener({ opener_source: 'dossier_research' }), false);
  });
  it('requires opener provenance (source url or research id)', () => {
    assert.equal(validateOpenerProvenance({ personalized_opener: 'hi' }).ok, false);
    assert.equal(
      validateOpenerProvenance({ personalized_opener: 'hi', opener_source_url: 'https://x.com/post' }).ok,
      true,
    );
  });
  it('rejects a prospect whose opener is generic AI even if other fields are present', () => {
    const r = validateCampaignProspect({
      first_name: 'Ara',
      company: 'Dossier',
      personalized_opener: 'I noticed your recent growth.',
      subject_line_a: 'hi',
      opener_source: 'apollo_ai',
      opener_source_url: 'https://apollo.io',
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /generic Apollo/.test(e)));
  });
  it('accepts a fully sourced Dossier prospect', () => {
    const r = validateCampaignProspect({
      first_name: 'Ara',
      company: 'Dossier',
      personalized_opener: 'Saw the Austin SDR job post last week.',
      subject_line_a: 'quick note',
      opener_source: 'dossier_research',
      opener_source_url: 'https://linkedin.com/jobs/123',
    });
    assert.equal(r.ok, true);
  });
});

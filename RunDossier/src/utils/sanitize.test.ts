import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeText, sanitizeEmail, containsMarkup } from './sanitize.js';

describe('sanitizeText', () => {
  it('strips control characters and trims', () => {
    assert.equal(sanitizeText('  hello\x00world  '), 'helloworld');
  });

  it('enforces max length', () => {
    assert.equal(sanitizeText('a'.repeat(20), 5).length, 5);
  });
});

describe('sanitizeEmail', () => {
  it('normalizes valid email', () => {
    assert.equal(sanitizeEmail('  Jane@Acme.COM '), 'jane@acme.com');
  });

  it('rejects invalid email', () => {
    assert.equal(sanitizeEmail('not-an-email'), '');
  });
});

describe('containsMarkup', () => {
  it('detects script-like patterns', () => {
    assert.equal(containsMarkup('<script>alert(1)</script>'), true);
    assert.equal(containsMarkup('plain text'), false);
  });
});

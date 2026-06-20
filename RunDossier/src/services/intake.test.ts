import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIntakeRecord, validateIntakeRecord, nameCompanyDedupeKey } from './intake.js';

describe('normalizeIntakeRecord', () => {
  it('normalizes linkedin URL and email', () => {
    const record = normalizeIntakeRecord({
      name: 'Jane Doe',
      linkedin_url: 'linkedin.com/in/janedoe',
      email: 'Jane@Acme.com',
      title: 'VP Sales',
      company: 'Acme',
    });

    assert.equal(record.name, 'Jane Doe');
    assert.equal(record.linkedin_url, 'https://www.linkedin.com/in/janedoe');
    assert.equal(record.email, 'jane@acme.com');
    assert.equal(record.title, 'VP Sales');
  });
});

describe('nameCompanyDedupeKey', () => {
  it('normalizes whitespace and case', () => {
    assert.equal(nameCompanyDedupeKey('  Jane Doe ', ' Acme Corp '), 'jane doe|acme corp');
  });
});

describe('validateIntakeRecord', () => {
  it('rejects missing linkedin_url', () => {
    const record = normalizeIntakeRecord({ name: 'Jane', client_id: 'cd435b0e-6767-499f-99cd-c42a14a18a35' });
    const err = validateIntakeRecord(record);
    assert.match(err ?? '', /linkedin_url/);
  });

  it('accepts a valid record', () => {
    const record = normalizeIntakeRecord({
      name: 'Jane Doe',
      linkedin_url: 'https://www.linkedin.com/in/janedoe',
      client_id: 'cd435b0e-6767-499f-99cd-c42a14a18a35',
    });
    assert.equal(validateIntakeRecord(record), null);
  });
});

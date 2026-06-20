import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeliveryCsv,
  filterDeliveryRows,
  formatResearchSignals,
  extractCompanyDomain,
  isInternalEmail,
  type DeliveryRow,
} from './csv-delivery.js';

function sampleRow(overrides: Partial<DeliveryRow> = {}): DeliveryRow {
  return {
    client_name: 'Test Client',
    prospect_name: 'Jane Doe',
    title: 'VP Sales',
    company: 'Acme Corp',
    company_domain: 'acme.com',
    linkedin_url: 'https://www.linkedin.com/in/janedoe',
    email: 'jane@acme.com',
    research_signals: 'Raised Series B',
    source_links: 'https://techcrunch.com/acme',
    research_summary: 'Recent funding indicates outbound investment.',
    confidence_score: 82,
    subject: 'quick note',
    opener: 'Saw the Series B news.',
    bridge: 'We help teams scale outbound after funding.',
    variant_number: 1,
    prospect_status: 'personalized_qa_passed',
    batch_id: 'batch-1',
    delivery_id: 'delivery-1',
    run_id: 'run-1',
    generated_at: '2026-06-20T12:00:00.000Z',
    ...overrides,
  };
}

describe('buildDeliveryCsv', () => {
  it('includes all required columns in header', () => {
    const csv = buildDeliveryCsv([sampleRow()]);
    const header = csv.split('\n')[0];
    assert.ok(header.includes('client_name'));
    assert.ok(header.includes('research_signals'));
    assert.ok(header.includes('run_id'));
    assert.equal(csv.split('\n').length, 2);
  });

  it('escapes commas and quotes in fields', () => {
    const csv = buildDeliveryCsv([
      sampleRow({ opener: 'He said "hello", then left' }),
    ]);
    assert.ok(csv.includes('"He said ""hello"", then left"'));
  });

  it('prevents duplicate rows when deduped upstream', () => {
    const row = sampleRow();
    const csv = buildDeliveryCsv([row, row]);
    assert.equal(csv.split('\n').length, 3);
  });
});

describe('filterDeliveryRows', () => {
  it('excludes internal emails from delivery', () => {
    const rows = filterDeliveryRows([
      sampleRow({ email: 'ara@getdossier.co' }),
      sampleRow({ email: 'client@acme.com' }),
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, 'client@acme.com');
  });
});

describe('formatResearchSignals', () => {
  it('joins signals and sources', () => {
    const result = formatResearchSignals([
      { signal: 'Hired SDR team', source: 'https://linkedin.com/jobs/1', date: '2026-01-01' },
      { signal: 'Series B', source: 'https://news.com/b', date: '2026-02-01' },
    ]);
    assert.match(result.text, /Hired SDR/);
    assert.match(result.sources, /linkedin.com/);
  });
});

describe('extractCompanyDomain', () => {
  it('uses corporate email domain when available', () => {
    assert.equal(extractCompanyDomain('jane@acme.com', 'Acme'), 'acme.com');
  });

  it('falls back to company slug for personal email', () => {
    assert.equal(extractCompanyDomain('jane@gmail.com', 'Acme Corp'), 'acmecorp.com');
  });
});

describe('isInternalEmail', () => {
  it('detects internal addresses', () => {
    assert.equal(isInternalEmail('test@example.com'), true);
    assert.equal(isInternalEmail('client@acme.com'), false);
  });
});

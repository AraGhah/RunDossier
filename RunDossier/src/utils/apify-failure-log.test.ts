import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApifyScrapeError } from './apify-error.js';
import { formatApifyFailureForDb } from './apify-failure-log.js';

describe('formatApifyFailureForDb', () => {
  it('structures ApifyScrapeError with run and dataset ids', () => {
    const err = new ApifyScrapeError('rate_limit', {
      actorId: 'harvestapi~linkedin-profile-scraper',
      httpStatus: 429,
      runId: 'run123',
      datasetId: 'ds456',
      status: 'FAILED',
      statusMessage: 'quota exceeded',
    });
    const record = formatApifyFailureForDb(err, {
      workflow: 'research',
      entityId: 'prospect-uuid',
      retryCount: 3,
      requestType: 'linkedin_scrape',
    });
    assert.equal(record.kind, 'rate_limit');
    assert.match(record.message, /runId=run123/);
    assert.match(record.message, /datasetId=ds456/);
    assert.match(record.message, /http=429/);
    assert.equal(record.workflow, 'research');
  });

  it('redacts plain errors', () => {
    const record = formatApifyFailureForDb(new Error('token apify_api_secret123 invalid'), {
      workflow: 'research',
      entityId: 'p1',
    });
    assert.ok(!record.message.includes('secret123'));
  });
});

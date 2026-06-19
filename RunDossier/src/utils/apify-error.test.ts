import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyApifyFailure,
  redactSecrets,
  ApifyScrapeError,
  apifyErrorFromThrown,
} from './apify-error.js';

describe('classifyApifyFailure', () => {
  it('detects auth failures', () => {
    assert.equal(classifyApifyFailure({ httpStatus: 401 }), 'auth');
    assert.equal(classifyApifyFailure({ errorMessage: 'approve its permissions' }), 'auth');
  });

  it('detects rate limit / quota', () => {
    assert.equal(classifyApifyFailure({ httpStatus: 429 }), 'rate_limit');
    assert.equal(classifyApifyFailure({ statusMessage: 'free user run limit exceeded' }), 'rate_limit');
  });

  it('detects timeout from run status', () => {
    assert.equal(classifyApifyFailure({ status: 'TIMED-OUT' }), 'timeout');
  });

  it('detects bad input', () => {
    assert.equal(classifyApifyFailure({ httpStatus: 400, errorMessage: 'invalid input' }), 'bad_input');
  });

  it('detects empty dataset', () => {
    assert.equal(classifyApifyFailure({ statusMessage: 'No profile returned' }), 'empty_dataset');
  });

  it('detects actor failure', () => {
    assert.equal(classifyApifyFailure({ status: 'FAILED' }), 'actor_failed');
  });

  it('falls back to unknown', () => {
    assert.equal(classifyApifyFailure({}), 'unknown');
  });
});

describe('redactSecrets', () => {
  it('hides an explicit token', () => {
    const out = redactSecrets('token=apify_api_SECRET123 failed', 'apify_api_SECRET123');
    assert.ok(!out.includes('apify_api_SECRET123'));
    assert.match(out, /\*\*\*/);
  });

  it('hides apify_api_ token patterns even without the token passed', () => {
    const out = redactSecrets('boom apify_api_abc123DEF456 boom', '');
    assert.ok(!out.includes('apify_api_abc123DEF456'));
  });
});

describe('ApifyScrapeError', () => {
  it('includes run id + dataset id and the failure kind, redacting secrets', () => {
    const err = new ApifyScrapeError('actor_failed', {
      actorId: 'me~actor',
      status: 'FAILED',
      runId: 'run123',
      datasetId: 'ds456',
      statusMessage: 'crashed with token=apify_api_LEAK999',
    });
    assert.equal(err.kind, 'actor_failed');
    assert.match(err.message, /runId=run123/);
    assert.match(err.message, /datasetId=ds456/);
    assert.ok(!err.message.includes('apify_api_LEAK999'));
  });
});

describe('apifyErrorFromThrown', () => {
  it('wraps a thrown 429 as a rate_limit ApifyScrapeError', () => {
    const err = apifyErrorFromThrown('me~actor', Object.assign(new Error('Too many requests'), { statusCode: 429 }));
    assert.equal(err.kind, 'rate_limit');
    assert.equal(err.context.httpStatus, 429);
  });
});

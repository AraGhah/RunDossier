import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { linkedinScrapeShouldRetry } from './linkedin.js';
import { ApifyScrapeError } from '../utils/apify-error.js';

// Gates retries and (by extension) the single-query fallback path: only
// transient failures retry; auth/quota/empty/bad-input are terminal.
describe('linkedinScrapeShouldRetry', () => {
  it('does NOT retry terminal Apify failures', () => {
    for (const kind of ['auth', 'rate_limit', 'empty_dataset', 'bad_input'] as const) {
      const err = new ApifyScrapeError(kind, { actorId: 'me~actor' });
      assert.equal(linkedinScrapeShouldRetry(err), false, `kind ${kind} should not retry`);
    }
  });

  it('retries transient Apify failures', () => {
    for (const kind of ['actor_failed', 'timeout', 'unknown'] as const) {
      const err = new ApifyScrapeError(kind, { actorId: 'me~actor' });
      assert.equal(linkedinScrapeShouldRetry(err), true, `kind ${kind} should retry`);
    }
  });

  it('treats empty profile / quota / permission plain errors as terminal', () => {
    assert.equal(linkedinScrapeShouldRetry(new Error('No LinkedIn profile returned for ...')), false);
    assert.equal(linkedinScrapeShouldRetry(new Error('free user run limit exceeded')), false);
    assert.equal(linkedinScrapeShouldRetry(new Error('please approve its permissions')), false);
  });

  it('retries other transient plain errors', () => {
    assert.equal(linkedinScrapeShouldRetry(new Error('socket hang up')), true);
  });
});

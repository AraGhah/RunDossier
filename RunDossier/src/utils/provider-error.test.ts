import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyProviderError,
  isTransientProviderError,
  providerErrorMessage,
} from './provider-error.js';

describe('classifyProviderError — transient (must retry, not dead-letter)', () => {
  it('detects Gemini prepayment credit depletion (the reported outage)', () => {
    assert.equal(
      classifyProviderError(new Error('Your prepayment credits are depleted. Please go to AI Studio...')),
      'transient',
    );
    assert.equal(isTransientProviderError('credits are depleted'), true);
  });
  it('detects rate limits / quota / 429', () => {
    assert.equal(classifyProviderError('Gemini API HTTP 429'), 'transient');
    assert.equal(classifyProviderError('RESOURCE_EXHAUSTED: quota'), 'transient');
    assert.equal(classifyProviderError('rate_limit exceeded'), 'transient');
  });
  it('detects overload / 5xx / unavailable', () => {
    assert.equal(classifyProviderError('Anthropic 529 overloaded'), 'transient');
    assert.equal(classifyProviderError('Gemini API HTTP 503'), 'transient');
    assert.equal(classifyProviderError('service unavailable'), 'transient');
  });
  it('detects network/timeout blips', () => {
    assert.equal(classifyProviderError(Object.assign(new Error('ECONNRESET'), {})), 'transient');
    assert.equal(classifyProviderError('fetch failed'), 'transient');
    assert.equal(classifyProviderError('request timed out'), 'transient');
  });
});

describe('classifyProviderError — permanent + unknown', () => {
  it('treats auth/permission/model errors as permanent', () => {
    assert.equal(classifyProviderError('API key not valid'), 'permanent');
    assert.equal(classifyProviderError('HTTP 403 permission denied'), 'permanent');
    assert.equal(classifyProviderError('model gemini-x not found'), 'permanent');
  });
  it('classifies QA-rejection / content errors as unknown (keep existing dead-letter behavior)', () => {
    assert.equal(classifyProviderError('no variant met ship criteria after ladder'), 'unknown');
    assert.equal(classifyProviderError(''), 'unknown');
    assert.equal(classifyProviderError(null), 'unknown');
  });
});

describe('providerErrorMessage', () => {
  it('extracts a message from Error, string, or object', () => {
    assert.equal(providerErrorMessage(new Error('boom')), 'boom');
    assert.equal(providerErrorMessage('boom'), 'boom');
    assert.match(providerErrorMessage({ error: { message: 'x' } }), /x/);
  });
});

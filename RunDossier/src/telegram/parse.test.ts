import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTelegramCommand,
  isAuthorizedTelegramChat,
  sanitizeTelegramError,
  isLongRunningCommand,
} from './parse.js';

describe('parseTelegramCommand', () => {
  it('parses command with bot suffix', () => {
    const parsed = parseTelegramCommand('/status@PreframeBot');
    assert.equal(parsed.command, 'status');
    assert.equal(parsed.isCommand, true);
  });

  it('parses command with args', () => {
    const parsed = parseTelegramCommand('/search client-1');
    assert.equal(parsed.command, 'search');
    assert.equal(parsed.args, 'client-1');
  });

  it('returns non-command for plain text', () => {
    const parsed = parseTelegramCommand('hello');
    assert.equal(parsed.isCommand, false);
  });
});

describe('isAuthorizedTelegramChat', () => {
  it('allows only configured chat id', () => {
    assert.equal(isAuthorizedTelegramChat(12345, '12345'), true);
    assert.equal(isAuthorizedTelegramChat(99999, '12345'), false);
    assert.equal(isAuthorizedTelegramChat(12345, undefined), false);
  });
});

describe('sanitizeTelegramError', () => {
  it('redacts secrets from error messages', () => {
    const out = sanitizeTelegramError('Failed apify_api_abc123xyz and Bearer sk-ant-api03-secret');
    assert.ok(!out.includes('abc123xyz'));
    assert.ok(!out.includes('sk-ant-api03-secret'));
    assert.ok(out.includes('***'));
  });
});

describe('isLongRunningCommand', () => {
  it('flags workflow commands', () => {
    assert.equal(isLongRunningCommand('run'), true);
    assert.equal(isLongRunningCommand('status'), false);
  });
});

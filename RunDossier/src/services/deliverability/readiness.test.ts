import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  authPasses,
  computeReadiness,
  canPromoteToScaled,
  effectiveState,
  evaluateAutoPause,
  decideSend,
  decideEnroll,
  assertCanSend,
  canEnrich,
  buildStateChangeEvent,
  SendBlockedError,
} from './readiness.js';
import { isTestMode, type SenderDomain } from './types.js';

const DAY = 86_400_000;

/** A healthy dedicated cold-sending domain: auth passing, warmed, mature, not paused. */
function sender(overrides: Partial<SenderDomain> = {}): SenderDomain {
  return {
    id: 'sd_1',
    domain: 'mail.trydossier.com',
    is_primary_domain: false,
    is_cold_sending_domain: true,
    provider: 'google_workspace',
    spf_status: 'pass',
    dkim_status: 'pass',
    dmarc_status: 'pass',
    dmarc_policy: 'none',
    mailbox_status: 'connected',
    mailbox_created_at: new Date(Date.now() - 40 * DAY).toISOString(),
    warmup_status: 'complete',
    warmup_started_at: new Date(Date.now() - 30 * DAY).toISOString(),
    sending_readiness: 'not_ready',
    daily_send_limit: 20,
    current_daily_send_count: 0,
    bounce_rate: 0,
    spam_rate: 0,
    reply_rate: 5,
    blacklist_status: 'clean',
    last_verified_at: null,
    last_error: null,
    is_sending_paused: false,
    pause_reason: null,
    primary_override: false,
    limited_test_passed: false,
    scaled_approved: false,
    provider_warning: false,
    ...overrides,
  };
}

describe('Part 9 #1 — primary domain cannot be used for scaled cold outreach by default', () => {
  it('a primary domain computes to blocked', () => {
    const s = sender({ is_primary_domain: true, is_cold_sending_domain: false, domain: 'getdossier.co' });
    assert.equal(computeReadiness(s).state, 'blocked');
  });
  it('rejects a scaled send and throws SendBlockedError', () => {
    const s = sender({ is_primary_domain: true, is_cold_sending_domain: false });
    assert.equal(decideSend(s, { scaled: true }).allowed, false);
    assert.throws(() => assertCanSend(s, { scaled: true }), SendBlockedError);
  });
  it('an explicit admin override is required to leave blocked', () => {
    const s = sender({ is_primary_domain: true, is_cold_sending_domain: false, primary_override: true });
    assert.notEqual(computeReadiness(s).state, 'blocked');
  });
});

describe('Part 9 #2 — missing DKIM/DMARC cannot reach limited_test_ready', () => {
  it('missing DKIM → auth_incomplete', () => {
    assert.equal(computeReadiness(sender({ dkim_status: 'missing' })).state, 'auth_incomplete');
  });
  it('missing DMARC → auth_incomplete', () => {
    assert.equal(computeReadiness(sender({ dmarc_status: 'missing' })).state, 'auth_incomplete');
  });
  it('all three passing is required', () => {
    assert.equal(authPasses(sender()), true);
    assert.equal(authPasses(sender({ spf_status: 'fail' })), false);
  });
});

describe('Part 9 #3 — a new mailbox cannot reach scaled_sending_ready', () => {
  it('a 3-day-old mailbox stays warming even with approvals', () => {
    const s = sender({
      mailbox_created_at: new Date(Date.now() - 3 * DAY).toISOString(),
      scaled_approved: true,
      limited_test_passed: true,
    });
    assert.equal(effectiveState(s), 'warming');
    assert.notEqual(effectiveState(s), 'scaled_sending_ready');
    assert.equal(canPromoteToScaled(s).state !== 'scaled_sending_ready', true);
  });
});

describe('readiness ladder — happy paths', () => {
  it('a warmed, authenticated dedicated domain is limited_test_ready', () => {
    assert.equal(computeReadiness(sender()).state, 'limited_test_ready');
  });
  it('with admin approval + passed test + clean metrics → scaled_sending_ready', () => {
    const s = sender({ scaled_approved: true, limited_test_passed: true, daily_send_limit: 50 });
    assert.equal(effectiveState(s), 'scaled_sending_ready');
    assert.equal(decideSend(s, { scaled: true }).allowed, true);
  });
  it('limited_test_ready daily allowance is clamped to the limited cap', () => {
    const s = sender({ daily_send_limit: 100, current_daily_send_count: 20 });
    // cap = min(100, 20) = 20, already reached
    assert.equal(decideSend(s).allowed, false);
    assert.equal(decideSend(sender({ daily_send_limit: 100, current_daily_send_count: 5 })).allowed, true);
  });
});

describe('Part 9 #5 — auto-pause when the bounce threshold is exceeded', () => {
  it('bounce rate >= 2% pauses', () => {
    const r = evaluateAutoPause(sender({ bounce_rate: 3 }));
    assert.equal(r.shouldPause, true);
    assert.match(r.reason ?? '', /bounce/);
  });
  it('spam, blacklist, provider warning, and disconnect also pause', () => {
    assert.equal(evaluateAutoPause(sender({ spam_rate: 0.5 })).shouldPause, true);
    assert.equal(evaluateAutoPause(sender({ blacklist_status: 'listed' })).shouldPause, true);
    assert.equal(evaluateAutoPause(sender({ provider_warning: true })).shouldPause, true);
    assert.equal(evaluateAutoPause(sender({ mailbox_status: 'disconnected' })).shouldPause, true);
  });
  it('a healthy sender does not pause', () => {
    assert.equal(evaluateAutoPause(sender()).shouldPause, false);
  });
});

describe('Part 9 #6 — a blocked or paused sender cannot enroll or send', () => {
  it('paused sender blocks enroll + send', () => {
    const s = sender({ is_sending_paused: true, pause_reason: 'manual' });
    assert.equal(decideEnroll(s).allowed, false);
    assert.equal(decideSend(s).allowed, false);
  });
  it('blocked sender blocks enroll', () => {
    const s = sender({ blacklist_status: 'listed' });
    assert.equal(decideEnroll(s).allowed, false);
  });
});

describe('Part 9 #7 — Apollo enrichment works while sending is disabled', () => {
  it('canEnrich() is independent of sender readiness', () => {
    assert.equal(canEnrich(), true);
    // even with the primary domain blocked, enrichment stays allowed
    const blocked = sender({ is_primary_domain: true, is_cold_sending_domain: false });
    assert.equal(decideSend(blocked).allowed, false);
    assert.equal(canEnrich(), true);
  });
});

describe('Part 9 #8 & #9 — test/production modes are separated; no live sends by default', () => {
  it('defaults to test mode (no live sending)', () => {
    assert.equal(isTestMode({} as NodeJS.ProcessEnv), true);
    assert.equal(isTestMode({ NODE_ENV: 'test' } as NodeJS.ProcessEnv), true);
  });
  it('production live sending requires an explicit opt-in flag', () => {
    assert.equal(
      isTestMode({ NODE_ENV: 'production', DELIVERABILITY_LIVE_SENDING: 'true' } as NodeJS.ProcessEnv),
      false,
    );
    assert.equal(isTestMode({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), true);
  });
});

describe('Part 9 #10 — state changes are logged', () => {
  it('buildStateChangeEvent captures from/to/reason/actor/timestamp', () => {
    const ev = buildStateChangeEvent(sender(), 'warming', 'limited_test_ready', 'warm-up complete', 'system');
    assert.equal(ev.from_state, 'warming');
    assert.equal(ev.to_state, 'limited_test_ready');
    assert.equal(ev.domain, 'mail.trydossier.com');
    assert.equal(ev.actor, 'system');
    assert.ok(Date.parse(ev.at) > 0);
  });
});

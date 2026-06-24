/**
 * Deliverability readiness — pure decision logic (no I/O).
 *
 * Server-side enforcement is built on these functions; the DB layer (repo) and the
 * send path (guard) call them. Every rule from the spec is encoded here so it can be
 * unit-tested deterministically.
 *
 * Ladder: blocked > paused > auth_incomplete > not_ready > warming > limited_test_ready > scaled_sending_ready
 * (computeReadiness never auto-returns scaled — that requires explicit admin approval + a passed test.)
 */
import {
  type SenderDomain,
  type ReadinessState,
  type DeliverabilityThresholds,
  DEFAULT_THRESHOLDS,
} from './types.js';

export interface ReadinessResult {
  state: ReadinessState;
  reasons: string[];
}

export class SendBlockedError extends Error {
  readonly code = 'SEND_BLOCKED';
  readonly state: ReadinessState;
  constructor(message: string, state: ReadinessState) {
    super(message);
    this.name = 'SendBlockedError';
    this.state = state;
  }
}

/** All three of SPF, DKIM, DMARC must explicitly pass on the sending domain. */
export function authPasses(s: Pick<SenderDomain, 'spf_status' | 'dkim_status' | 'dmarc_status'>): boolean {
  return s.spf_status === 'pass' && s.dkim_status === 'pass' && s.dmarc_status === 'pass';
}

export function mailboxAgeDays(s: Pick<SenderDomain, 'mailbox_created_at'>, now: number = Date.now()): number | null {
  if (!s.mailbox_created_at) return null;
  const created = new Date(s.mailbox_created_at).getTime();
  if (!Number.isFinite(created)) return null;
  return (now - created) / 86_400_000;
}

/**
 * Fact-derived readiness. Capped at limited_test_ready — scaled requires admin sign-off
 * (see canPromoteToScaled / effectiveState). Order of checks is the safety priority.
 */
export function computeReadiness(
  s: SenderDomain,
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): ReadinessResult {
  const reasons: string[] = [];

  if (s.blacklist_status === 'listed') {
    return { state: 'blocked', reasons: ['domain is on a blacklist'] };
  }

  if (s.is_sending_paused) {
    return { state: 'paused', reasons: [s.pause_reason || 'sending is paused'] };
  }

  // Rule 1: the primary operating domain is blocked for scaled cold outreach by default.
  if (s.is_primary_domain && !s.is_cold_sending_domain && !s.primary_override) {
    return {
      state: 'blocked',
      reasons: ['primary operating domain — not for scaled cold outreach (use a dedicated sending domain)'],
    };
  }

  // Rule 3: cannot progress past auth without SPF + DKIM + DMARC passing on the sending domain.
  if (!authPasses(s)) {
    if (s.spf_status !== 'pass') reasons.push('SPF not passing');
    if (s.dkim_status !== 'pass') reasons.push('DKIM not passing');
    if (s.dmarc_status !== 'pass') reasons.push('DMARC not passing');
    return { state: 'auth_incomplete', reasons };
  }

  if (s.mailbox_status === 'disconnected' || s.mailbox_status === 'invalid') {
    return { state: 'not_ready', reasons: [`mailbox ${s.mailbox_status}`] };
  }

  // Rule 2: a new mailbox / incomplete warm-up means warming, never send-ready.
  const age = mailboxAgeDays(s, now);
  if (age != null && age < t.minMailboxAgeDays) {
    reasons.push(`mailbox is ${Math.floor(age)}d old (< ${t.minMailboxAgeDays}d)`);
  }
  if (s.warmup_status !== 'complete' && s.warmup_status !== 'skipped') {
    reasons.push(`warm-up ${s.warmup_status}`);
  }
  if (reasons.length > 0) {
    return { state: 'warming', reasons };
  }

  // Auth ok, mailbox mature, warm-up complete → eligible for limited testing.
  return { state: 'limited_test_ready', reasons: ['auth passing, mailbox warmed — limited testing only'] };
}

/** Gate for scaled_sending_ready (Rule 4): proven test + thresholds + explicit admin approval. */
export function canPromoteToScaled(
  s: SenderDomain,
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): ReadinessResult {
  const base = computeReadiness(s, t, now);
  const reasons: string[] = [];
  if (base.state !== 'limited_test_ready') reasons.push(`not limited_test_ready (is ${base.state})`);
  if (!s.limited_test_passed) reasons.push('limited test batch not passed');
  if (!s.scaled_approved) reasons.push('missing explicit admin approval');
  const age = mailboxAgeDays(s, now);
  if (age != null && age < t.minMailboxAgeDays) reasons.push('mailbox too new');
  if (s.bounce_rate != null && s.bounce_rate >= t.maxBounceRatePct) reasons.push(`bounce rate ${s.bounce_rate}% >= ${t.maxBounceRatePct}%`);
  if (s.spam_rate != null && s.spam_rate >= t.maxSpamRatePct) reasons.push(`spam rate ${s.spam_rate}% >= ${t.maxSpamRatePct}%`);
  if (s.blacklist_status === 'listed') reasons.push('blacklisted');
  if (s.provider_warning) reasons.push('active provider warning');
  return reasons.length === 0
    ? { state: 'scaled_sending_ready', reasons: [] }
    : { state: base.state, reasons };
}

/** Final effective state including the scaled upgrade when approved. */
export function effectiveState(
  s: SenderDomain,
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): ReadinessState {
  const base = computeReadiness(s, t, now);
  if (base.state === 'limited_test_ready' && s.scaled_approved && s.limited_test_passed) {
    if (canPromoteToScaled(s, t, now).state === 'scaled_sending_ready') return 'scaled_sending_ready';
  }
  return base.state;
}

export interface AutoPauseResult {
  shouldPause: boolean;
  reason: string | null;
}

/** Rule 5: conditions that force an automatic pause. Returns the first match. */
export function evaluateAutoPause(
  s: SenderDomain,
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
): AutoPauseResult {
  if (s.blacklist_status === 'listed') return { shouldPause: true, reason: 'blacklist event' };
  if (s.provider_warning) return { shouldPause: true, reason: 'provider deliverability warning' };
  if (s.mailbox_status === 'disconnected' || s.mailbox_status === 'invalid') {
    return { shouldPause: true, reason: `sender account ${s.mailbox_status} (credentials)` };
  }
  if (s.bounce_rate != null && s.bounce_rate >= t.maxBounceRatePct) {
    return { shouldPause: true, reason: `bounce rate ${s.bounce_rate}% >= ${t.maxBounceRatePct}%` };
  }
  if (s.spam_rate != null && s.spam_rate >= t.maxSpamRatePct) {
    return { shouldPause: true, reason: `spam rate ${s.spam_rate}% >= ${t.maxSpamRatePct}%` };
  }
  if (s.is_cold_sending_domain && !authPasses(s)) {
    return { shouldPause: true, reason: 'missing SPF/DKIM/DMARC alignment on cold sending domain' };
  }
  if (s.daily_send_limit > 0 && s.current_daily_send_count >= s.daily_send_limit) {
    return { shouldPause: true, reason: 'daily volume limit reached' };
  }
  return { shouldPause: false, reason: null };
}

export interface SendDecision {
  allowed: boolean;
  reason: string | null;
  state: ReadinessState;
}

/** Allowance for a single cold send. daily limit is clamped to the limited-test cap while testing. */
export function decideSend(
  s: SenderDomain,
  opts: { scaled?: boolean } = {},
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): SendDecision {
  const state = effectiveState(s, t, now);
  if (state === 'blocked') return { allowed: false, reason: s.pause_reason || 'sender blocked', state };
  if (state === 'paused') return { allowed: false, reason: s.pause_reason || 'sender paused', state };
  if (state !== 'limited_test_ready' && state !== 'scaled_sending_ready') {
    return { allowed: false, reason: `sender not send-ready (${state})`, state };
  }
  if (opts.scaled && state !== 'scaled_sending_ready') {
    return { allowed: false, reason: 'scaled send requested but sender is limited_test_ready only', state };
  }
  const cap = state === 'limited_test_ready'
    ? Math.min(s.daily_send_limit || 0, t.limitedTestDailyMax)
    : s.daily_send_limit || 0;
  if (cap <= 0) return { allowed: false, reason: 'no daily send allowance configured', state };
  if (s.current_daily_send_count >= cap) return { allowed: false, reason: 'daily send limit reached', state };
  return { allowed: true, reason: null, state };
}

/** Throwing variant for the send path (server-side enforcement). */
export function assertCanSend(
  s: SenderDomain,
  opts: { scaled?: boolean } = {},
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): void {
  const d = decideSend(s, opts, t, now);
  if (!d.allowed) throw new SendBlockedError(`Send blocked for ${s.domain}: ${d.reason}`, d.state);
}

/** Rule 6: enrollment requires a send-ready, non-paused sender. */
export function decideEnroll(
  s: SenderDomain,
  t: DeliverabilityThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): SendDecision {
  const state = effectiveState(s, t, now);
  if (state === 'limited_test_ready' || state === 'scaled_sending_ready') {
    return { allowed: true, reason: null, state };
  }
  return { allowed: false, reason: `cannot enroll into a ${state} sender`, state };
}

/**
 * Part 8: Apollo prospecting/enrichment is decoupled from sending. Enrichment is always
 * permitted regardless of any sender's readiness — credit spend has its own controls.
 */
export function canEnrich(): boolean {
  return true;
}

export interface StateChangeEvent {
  domain_id: string | null;
  domain: string;
  from_state: ReadinessState | null;
  to_state: ReadinessState | null;
  reason: string | null;
  actor: string;
  metadata: Record<string, unknown>;
  at: string;
}

/** Build a loggable state-change event (Part 9 #10 — every transition is recorded). */
export function buildStateChangeEvent(
  s: Pick<SenderDomain, 'id' | 'domain'>,
  from: ReadinessState | null,
  to: ReadinessState | null,
  reason: string | null,
  actor = 'system',
  metadata: Record<string, unknown> = {},
  at: Date = new Date(),
): StateChangeEvent {
  return {
    domain_id: s.id ?? null,
    domain: s.domain,
    from_state: from,
    to_state: to,
    reason,
    actor,
    metadata,
    at: at.toISOString(),
  };
}

/**
 * Deliverability readiness — shared types + thresholds.
 *
 * The model encodes Dossier's sending-safety policy: a sender must earn its way up
 * a readiness ladder, the primary operating domain is blocked for scaled cold
 * outreach by default, and a new mailbox can never be scaled. All decision logic
 * built on these types lives in `readiness.ts` and is pure (unit-testable, no I/O).
 */

export type ReadinessState =
  | 'not_ready'
  | 'auth_incomplete'
  | 'warming'
  | 'limited_test_ready'
  | 'scaled_sending_ready'
  | 'paused'
  | 'blocked';

export type AuthStatus = 'unknown' | 'pass' | 'fail' | 'missing';
export type DmarcPolicy = 'none' | 'quarantine' | 'reject' | 'unknown';
export type MailboxStatus = 'unknown' | 'connected' | 'disconnected' | 'invalid';
export type WarmupStatus = 'not_started' | 'warming' | 'complete' | 'skipped';
export type BlacklistStatus = 'unknown' | 'clean' | 'listed';

/** Mirrors the `sender_domains` table (migration 026). */
export interface SenderDomain {
  id: string;
  domain: string;
  is_primary_domain: boolean;
  is_cold_sending_domain: boolean;
  provider: string | null;
  spf_status: AuthStatus;
  dkim_status: AuthStatus;
  dmarc_status: AuthStatus;
  dmarc_policy: DmarcPolicy;
  mailbox_status: MailboxStatus;
  mailbox_created_at: string | null;
  warmup_status: WarmupStatus;
  warmup_started_at: string | null;
  sending_readiness: ReadinessState;
  daily_send_limit: number;
  current_daily_send_count: number;
  bounce_rate: number | null;
  spam_rate: number | null;
  reply_rate: number | null;
  blacklist_status: BlacklistStatus;
  last_verified_at: string | null;
  last_error: string | null;
  is_sending_paused: boolean;
  pause_reason: string | null;
  primary_override: boolean;
  limited_test_passed: boolean;
  scaled_approved: boolean;
  provider_warning: boolean;
}

export interface DeliverabilityThresholds {
  /** A mailbox younger than this can never reach scaled_sending_ready. */
  minMailboxAgeDays: number;
  /** Minimum warm-up duration before limited testing. */
  minWarmupDays: number;
  /** Bounce rate (percent) at/above which a sender auto-pauses and cannot scale. */
  maxBounceRatePct: number;
  /** Spam-complaint rate (percent) at/above which a sender auto-pauses. */
  maxSpamRatePct: number;
  /** Hard cap on sends/day while limited_test_ready. */
  limitedTestDailyMax: number;
  /** Default size of the first real-contact test batch. */
  limitedTestContactsMax: number;
}

export const DEFAULT_THRESHOLDS: DeliverabilityThresholds = {
  minMailboxAgeDays: 14,
  minWarmupDays: 14,
  maxBounceRatePct: 2,
  maxSpamRatePct: 0.1,
  limitedTestDailyMax: 20,
  limitedTestContactsMax: 10,
};

function num(envVal: string | undefined, fallback: number): number {
  const n = envVal != null ? Number(envVal) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Thresholds with optional env overrides (DELIVERABILITY_*). */
export function loadThresholds(env: NodeJS.ProcessEnv = process.env): DeliverabilityThresholds {
  return {
    minMailboxAgeDays: num(env.DELIVERABILITY_MIN_MAILBOX_AGE_DAYS, DEFAULT_THRESHOLDS.minMailboxAgeDays),
    minWarmupDays: num(env.DELIVERABILITY_MIN_WARMUP_DAYS, DEFAULT_THRESHOLDS.minWarmupDays),
    maxBounceRatePct: num(env.DELIVERABILITY_MAX_BOUNCE_PCT, DEFAULT_THRESHOLDS.maxBounceRatePct),
    maxSpamRatePct: num(env.DELIVERABILITY_MAX_SPAM_PCT, DEFAULT_THRESHOLDS.maxSpamRatePct),
    limitedTestDailyMax: num(env.DELIVERABILITY_LIMITED_DAILY_MAX, DEFAULT_THRESHOLDS.limitedTestDailyMax),
    limitedTestContactsMax: num(env.DELIVERABILITY_LIMITED_CONTACTS_MAX, DEFAULT_THRESHOLDS.limitedTestContactsMax),
  };
}

/** Test vs production mode. Cold sending is force-disabled unless explicitly in production-send mode. */
export function isTestMode(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'test') return true;
  // Real cold sending requires an explicit opt-in flag; absent it, we are always in (safe) test mode.
  return env.DELIVERABILITY_LIVE_SENDING !== 'true';
}

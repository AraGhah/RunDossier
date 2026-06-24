/**
 * Server-side cold-send enforcement (Parts 7 & 8).
 *
 * Every cold-send path must pass through here. It is FAIL-CLOSED: any uncertainty
 * (no approved sender, DB error, auto-pause condition) results in "not allowed".
 * Apollo enrichment deliberately does NOT call this — enrichment is decoupled from
 * sending and stays available regardless of sender readiness.
 */
import { loadThresholds, type SenderDomain } from './types.js';
import { decideSend, decideEnroll, evaluateAutoPause } from './readiness.js';
import { validateCampaignProspect, type CampaignProspect } from './merge-fields.js';
import { getColdSender, pauseSender } from './sender-domains.repo.js';
import { logger } from '../../utils/logger.js';

export interface GateResult {
  allowed: boolean;
  reason: string | null;
  domain?: string;
  state?: string;
}

const thresholds = loadThresholds();

/** Auto-pause the sender if a Part-7 trigger fires; returns true if it paused. */
async function autoPauseIfNeeded(sender: SenderDomain): Promise<boolean> {
  if (sender.is_sending_paused) return true;
  const verdict = evaluateAutoPause(sender, thresholds);
  if (verdict.shouldPause) {
    await pauseSender(sender, verdict.reason ?? 'auto-pause', 'auto');
    logger.warn('sender_auto_paused', { domain: sender.domain, reason: verdict.reason });
    return true;
  }
  return false;
}

/**
 * Is a cold send currently allowed? Resolves the approved cold-sending domain and runs
 * the readiness gate. Returns a status object (never throws).
 */
export async function coldSendAllowed(opts: { scaled?: boolean } = {}): Promise<GateResult> {
  try {
    const sender = await getColdSender();
    if (!sender) {
      return { allowed: false, reason: 'no approved cold-sending domain configured (primary domain is never used)' };
    }
    if (await autoPauseIfNeeded(sender)) {
      return { allowed: false, reason: sender.pause_reason || 'sender paused', domain: sender.domain, state: 'paused' };
    }
    const d = decideSend(sender, opts, thresholds);
    return { allowed: d.allowed, reason: d.reason, domain: sender.domain, state: d.state };
  } catch (err) {
    logger.warn('cold_send_gate_error_fail_closed', { error: (err as Error).message });
    return { allowed: false, reason: 'deliverability gate error — failing closed' };
  }
}

/** Throwing variant for callers that prefer an exception. */
export async function assertColdSendAllowed(opts: { scaled?: boolean } = {}): Promise<void> {
  const r = await coldSendAllowed(opts);
  if (!r.allowed) throw new Error(`Cold send blocked: ${r.reason}`);
}

/**
 * Gate a single prospect enrollment: the sender must be enroll-ready AND the prospect
 * must pass merge-field + opener-provenance validation (Part 8).
 */
export async function guardEnrollProspect(prospect: CampaignProspect): Promise<GateResult> {
  const fields = validateCampaignProspect(prospect);
  if (!fields.ok) {
    return { allowed: false, reason: `merge-field validation failed: ${fields.errors.join('; ')}` };
  }
  try {
    const sender = await getColdSender();
    if (!sender) return { allowed: false, reason: 'no approved cold-sending domain configured' };
    if (await autoPauseIfNeeded(sender)) {
      return { allowed: false, reason: sender.pause_reason || 'sender paused', domain: sender.domain };
    }
    const d = decideEnroll(sender, thresholds);
    return { allowed: d.allowed, reason: d.reason, domain: sender.domain, state: d.state };
  } catch (err) {
    logger.warn('enroll_gate_error_fail_closed', { error: (err as Error).message });
    return { allowed: false, reason: 'deliverability gate error — failing closed' };
  }
}

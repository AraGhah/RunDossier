/**
 * Sender-domain persistence + state-change logging.
 * Thin DB layer over the `sender_domains` / `sender_domain_events` tables (migration 026).
 */
import { query, queryOne, pool } from '../../db.js';
import { writeAuditEvent } from '../../utils/audit-log.js';
import { logger } from '../../utils/logger.js';
import type { SenderDomain, ReadinessState } from './types.js';
import { type StateChangeEvent, buildStateChangeEvent } from './readiness.js';

function iso(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}
function n(v: unknown): number | null {
  return v == null ? null : Number(v);
}

function rowToSender(r: Record<string, unknown>): SenderDomain {
  return {
    id: String(r.id),
    domain: String(r.domain),
    is_primary_domain: Boolean(r.is_primary_domain),
    is_cold_sending_domain: Boolean(r.is_cold_sending_domain),
    provider: (r.provider as string) ?? null,
    spf_status: r.spf_status as SenderDomain['spf_status'],
    dkim_status: r.dkim_status as SenderDomain['dkim_status'],
    dmarc_status: r.dmarc_status as SenderDomain['dmarc_status'],
    dmarc_policy: r.dmarc_policy as SenderDomain['dmarc_policy'],
    mailbox_status: r.mailbox_status as SenderDomain['mailbox_status'],
    mailbox_created_at: iso(r.mailbox_created_at),
    warmup_status: r.warmup_status as SenderDomain['warmup_status'],
    warmup_started_at: iso(r.warmup_started_at),
    sending_readiness: r.sending_readiness as ReadinessState,
    daily_send_limit: Number(r.daily_send_limit) || 0,
    current_daily_send_count: Number(r.current_daily_send_count) || 0,
    bounce_rate: n(r.bounce_rate),
    spam_rate: n(r.spam_rate),
    reply_rate: n(r.reply_rate),
    blacklist_status: r.blacklist_status as SenderDomain['blacklist_status'],
    last_verified_at: iso(r.last_verified_at),
    last_error: (r.last_error as string) ?? null,
    is_sending_paused: Boolean(r.is_sending_paused),
    pause_reason: (r.pause_reason as string) ?? null,
    primary_override: Boolean(r.primary_override),
    limited_test_passed: Boolean(r.limited_test_passed),
    scaled_approved: Boolean(r.scaled_approved),
    provider_warning: Boolean(r.provider_warning),
  };
}

export async function listSenderDomains(): Promise<SenderDomain[]> {
  const rows = await query('SELECT * FROM sender_domains ORDER BY is_primary_domain DESC, domain');
  return rows.map(rowToSender);
}

export async function getSenderByDomain(domain: string): Promise<SenderDomain | null> {
  const row = await queryOne('SELECT * FROM sender_domains WHERE domain = $1', [domain]);
  return row ? rowToSender(row) : null;
}

export async function getSenderById(id: string): Promise<SenderDomain | null> {
  const row = await queryOne('SELECT * FROM sender_domains WHERE id = $1', [id]);
  return row ? rowToSender(row) : null;
}

/**
 * The configured cold-sending domain: an explicit env override, else the single row
 * flagged is_cold_sending_domain. Never falls back to the primary domain.
 */
export async function getColdSender(): Promise<SenderDomain | null> {
  const envDomain = process.env.SMARTLEAD_SENDER_DOMAIN?.trim() || process.env.COLD_SENDING_DOMAIN?.trim();
  if (envDomain) return getSenderByDomain(envDomain);
  const row = await queryOne(
    `SELECT * FROM sender_domains WHERE is_cold_sending_domain = TRUE AND is_primary_domain = FALSE
     ORDER BY updated_at DESC LIMIT 1`,
  );
  return row ? rowToSender(row) : null;
}

/** Append a state-change row and mirror it to the tamper-evident audit log. */
export async function recordStateChange(ev: StateChangeEvent): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO sender_domain_events (domain_id, domain, from_state, to_state, reason, actor, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [ev.domain_id, ev.domain, ev.from_state, ev.to_state, ev.reason, ev.actor, JSON.stringify(ev.metadata ?? {})],
    );
  } catch (err) {
    logger.warn('sender_state_event_write_failed', { error: (err as Error).message, domain: ev.domain });
  }
  await writeAuditEvent({
    action: 'sender_domain.state_change',
    actorRole: ev.actor,
    resourceType: 'sender_domain',
    resourceId: ev.domain,
    metadata: { from: ev.from_state, to: ev.to_state, reason: ev.reason, ...ev.metadata },
  });
}

/** Persist a readiness transition + log it. */
export async function setReadiness(
  sender: SenderDomain,
  to: ReadinessState,
  reason: string,
  actor = 'system',
): Promise<void> {
  if (sender.sending_readiness === to) return;
  await query('UPDATE sender_domains SET sending_readiness = $1 WHERE id = $2', [to, sender.id]);
  await recordStateChange(buildStateChangeEvent(sender, sender.sending_readiness, to, reason, actor));
}

/** Pause a sender (Part 7). Stops enroll/send until manually resumed. */
export async function pauseSender(sender: SenderDomain, reason: string, actor = 'auto'): Promise<void> {
  await query(
    `UPDATE sender_domains
       SET is_sending_paused = TRUE, sending_readiness = 'paused', pause_reason = $1, last_error = $1
     WHERE id = $2`,
    [reason, sender.id],
  );
  await recordStateChange(
    buildStateChangeEvent(sender, sender.sending_readiness, 'paused', reason, actor, { autoPause: actor === 'auto' }),
  );
}

/** Manual resume after an operator has resolved the issue (Part 7). */
export async function resumeSender(sender: SenderDomain, actor: string): Promise<void> {
  await query(
    `UPDATE sender_domains SET is_sending_paused = FALSE, pause_reason = NULL WHERE id = $1`,
    [sender.id],
  );
  await recordStateChange(
    buildStateChangeEvent(sender, 'paused', 'not_ready', 'manual resume — re-evaluating readiness', actor),
  );
}

export async function recentEvents(limit = 25): Promise<Record<string, unknown>[]> {
  return query(
    `SELECT domain, from_state, to_state, reason, actor, created_at
       FROM sender_domain_events ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
}

import { createHash } from 'node:crypto';
import { pool } from '../db.js';
import { logger } from './logger.js';

export interface AuditEventInput {
  requestId?: string;
  actorRole?: string;
  actorSub?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

function hashRow(prevHash: string, payload: string): string {
  return createHash('sha256').update(`${prevHash}|${payload}`).digest('hex');
}

/** Append-only audit trail with hash chain (tamper-evident). Fails open if table missing. */
export async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const { rows } = await pool.query<{ row_hash: string }>(
      `SELECT row_hash FROM audit_events ORDER BY id DESC LIMIT 1`,
    );
    const prevHash = rows[0]?.row_hash ?? 'GENESIS';
    const payload = JSON.stringify({
      action: input.action,
      actorRole: input.actorRole,
      actorSub: input.actorSub,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      at: new Date().toISOString(),
    });
    const rowHash = hashRow(prevHash, payload);

    await pool.query(
      `INSERT INTO audit_events (
        request_id, actor_role, actor_sub, action, resource_type, resource_id, ip, metadata, prev_hash, row_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        input.requestId ?? null,
        input.actorRole ?? null,
        input.actorSub ?? null,
        input.action,
        input.resourceType ?? null,
        input.resourceId ?? null,
        input.ip ?? null,
        JSON.stringify(input.metadata ?? {}),
        prevHash,
        rowHash,
      ],
    );
  } catch (err) {
    logger.warn('audit_log_write_failed', { error: (err as Error).message, action: input.action });
  }
}

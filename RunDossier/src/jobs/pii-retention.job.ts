import { pool } from '../db.js';
import { writeAuditEvent } from '../utils/audit-log.js';
import { logger } from '../utils/logger.js';

/** Aligns with landing privacy policy: pilot contact 12 months, delivered prospect data 90 days. */
const PILOT_RETENTION_DAYS = 365;
const PROSPECT_RETENTION_DAYS = 90;

export async function runPiiRetention(): Promise<{ pilotsDeleted: number; prospectsDeleted: number }> {
  const pilotResult = await pool.query(
    `DELETE FROM pilot_requests
     WHERE created_at < NOW() - ($1 || ' days')::INTERVAL
     RETURNING id`,
    [String(PILOT_RETENTION_DAYS)],
  );

  const prospectResult = await pool.query(
    `DELETE FROM prospects
     WHERE status IN ('personalized_qa_passed', 'qa_failed', 'personalization_failed', 'research_failed', 'thin_research')
       AND updated_at < NOW() - ($1 || ' days')::INTERVAL
     RETURNING id`,
    [String(PROSPECT_RETENTION_DAYS)],
  );

  const summary = {
    pilotsDeleted: pilotResult.rowCount ?? 0,
    prospectsDeleted: prospectResult.rowCount ?? 0,
  };

  logger.info('pii_retention_completed', summary);
  await writeAuditEvent({
    action: 'pii.retention.completed',
    actorRole: 'system',
    metadata: summary,
  });

  return summary;
}

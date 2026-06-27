import { query } from '../db.js';

export interface DeliveryRepairSummary {
  resetCount: number;
  clientIds: string[];
}

/** Prospects marked delivered without a successful email in the deliveries ledger. */
export async function countMisdeliveredProspects(clientId?: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT count(*)::text AS n FROM prospects p
     WHERE p.status = 'delivered'
       ${clientId ? 'AND p.client_id = $1' : ''}
       AND NOT EXISTS (
         SELECT 1 FROM deliveries d
         WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_sent'
       )`,
    clientId ? [clientId] : []
  );
  return Number(rows[0]?.n ?? 0);
}

/**
 * Reset prospects that were incorrectly finalized without a confirmed email send.
 * Idempotent — only touches rows with no email_sent ledger entry.
 */
export async function repairMisdeliveredProspects(clientId?: string): Promise<DeliveryRepairSummary> {
  const rows = await query<{ client_id: string }>(
    `UPDATE prospects p
        SET status = 'personalized_qa_passed',
            delivered_at = NULL,
            updated_at = NOW()
      WHERE p.status = 'delivered'
        ${clientId ? 'AND p.client_id = $1' : ''}
        AND NOT EXISTS (
          SELECT 1 FROM deliveries d
          WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_sent'
        )
      RETURNING p.client_id`,
    clientId ? [clientId] : []
  );
  const clientIds = [...new Set(rows.map((r) => r.client_id))];
  return { resetCount: rows.length, clientIds };
}

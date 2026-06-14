import { query } from '../db.js';
import { runDeliveryForClient } from '../jobs/delivery.job.js';

/** Statuses that still need pipeline work (including automatic retries). */
const PIPELINE_ACTIVE_STATUSES = [
  'queued',
  'research_in_progress',
  'research_complete',
  'personalization_in_progress',
  'research_failed',
  'qa_failed',
] as const;

/**
 * Run W5 delivery (CSV + client email) when no prospects for this client are still
 * in the research → personalize → QA pipeline.
 */
export async function maybeRunDeliveryForClient(clientId: string): Promise<void> {
  if (!clientId) return;

  const [pending] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM prospects
     WHERE client_id = $1
       AND trim(status) = ANY($2::text[])`,
    [clientId, PIPELINE_ACTIVE_STATUSES]
  );
  if (Number(pending?.count ?? 0) > 0) return;

  const [ready] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM prospects
     WHERE client_id = $1 AND trim(status) = 'personalized_qa_passed'`,
    [clientId]
  );
  if (Number(ready?.count ?? 0) === 0) return;

  await runDeliveryForClient(clientId);
}

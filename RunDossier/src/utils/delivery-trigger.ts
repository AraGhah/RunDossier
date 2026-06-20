import { query } from '../db.js';
import { runDeliveryForClient } from '../jobs/delivery.job.js';

/** Statuses that block delivery — actively in pipeline (not retryable failures). */
const PIPELINE_ACTIVE_STATUSES = [
  'queued',
  'research_in_progress',
  'research_complete',
  'personalization_in_progress',
  'delivering',
] as const;

/**
 * Pure gate: only deliver when nothing for this client is still moving through
 * the research → personalize → QA pipeline AND at least one prospect is ready.
 * Extracted so the gating rule can be unit-tested without a database.
 */
export function shouldRunDelivery(pendingPipelineCount: number, readyCount: number): boolean {
  return pendingPipelineCount === 0 && readyCount > 0;
}

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

  const [ready] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM prospects
     WHERE client_id = $1 AND trim(status) = 'personalized_qa_passed'`,
    [clientId]
  );

  if (!shouldRunDelivery(Number(pending?.count ?? 0), Number(ready?.count ?? 0))) return;

  await runDeliveryForClient(clientId);
}

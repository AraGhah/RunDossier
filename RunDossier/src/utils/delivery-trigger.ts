import { query } from '../db.js';
import { runDeliveryForClient } from '../jobs/delivery.job.js';
import { getActiveParentBatchForClient } from '../services/parent-batch.js';
import { shouldRunDelivery, PIPELINE_ACTIVE_STATUSES } from './batch-progress.js';

export { shouldRunDelivery, PIPELINE_ACTIVE_STATUSES };

/**
 * Legacy client-level delivery trigger.
 * Parent batches are delivered ONLY by the batch-orchestrator — never here.
 */
export async function maybeRunDeliveryForClient(clientId: string): Promise<void> {
  if (!clientId) return;

  const activeParent = await getActiveParentBatchForClient(clientId);
  if (activeParent) return;

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

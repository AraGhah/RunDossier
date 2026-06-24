import { query, queryOne } from '../db.js';
import {
  emptyBatchCounts,
  type BatchStatusCounts,
  type ParentBatchProgress,
  percentComplete,
  pipelineActiveCount,
  excludedCount,
  failedTerminalCount,
} from '../utils/batch-progress.js';

export type ParentBatchStatus =
  | 'queued'
  | 'processing'
  | 'delivering'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'stalled';

export interface ParentBatch {
  id: string;
  client_id: string;
  requested_prospect_count: number;
  status: ParentBatchStatus;
  imported_count: number;
  delivered_count: number;
  excluded_thin_research: number;
  failed_count: number;
  current_chunk: number;
  replacement_used: boolean;
  source_exhausted: boolean;
  source_miss_streak?: number;
  last_prospect_activity_at: string | null;
  delivery_id: string | null;
  stall_alerted_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateParentBatchInput {
  clientId: string;
  requestedCount: number;
  metadata?: Record<string, unknown>;
}

export class ActiveParentBatchError extends Error {
  constructor(public readonly existingBatchId: string) {
    super(`Client already has an active parent batch: ${existingBatchId}`);
    this.name = 'ActiveParentBatchError';
  }
}

export async function createParentBatch(input: CreateParentBatchInput): Promise<ParentBatch> {
  const existing = await getActiveParentBatchForClient(input.clientId);
  if (existing) {
    throw new ActiveParentBatchError(existing.id);
  }

  const row = await queryOne<ParentBatch>(
    `INSERT INTO parent_batches (client_id, requested_prospect_count, status, metadata)
     VALUES ($1, $2, 'processing', $3::jsonb)
     RETURNING *`,
    [input.clientId, input.requestedCount, JSON.stringify(input.metadata ?? {})]
  );
  if (!row) throw new Error('Failed to create parent batch');
  await logBatchEvent({
    parentBatchId: row.id,
    eventType: 'parent_batch_created',
    message: `Requested ${input.requestedCount} prospects`,
    metadata: input.metadata,
  });
  return row;
}

export async function getParentBatch(id: string): Promise<ParentBatch | null> {
  return queryOne<ParentBatch>(`SELECT * FROM parent_batches WHERE id = $1`, [id]);
}

export async function getActiveParentBatchForClient(clientId: string): Promise<ParentBatch | null> {
  return queryOne<ParentBatch>(
    `SELECT * FROM parent_batches
     WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
     ORDER BY created_at DESC
     LIMIT 1`,
    [clientId]
  );
}

export async function listActiveParentBatches(): Promise<ParentBatch[]> {
  return query<ParentBatch>(
    `SELECT * FROM parent_batches
     WHERE status IN ('queued', 'processing', 'delivering')
     ORDER BY created_at ASC`
  );
}

export async function countProspectsForParentBatch(parentBatchId: string): Promise<BatchStatusCounts> {
  const counts = emptyBatchCounts();
  const rows = await query<{ status: string; count: string }>(
    `SELECT trim(status) AS status, COUNT(*)::text AS count
     FROM prospects
     WHERE parent_batch_id = $1
     GROUP BY trim(status)`,
    [parentBatchId]
  );
  for (const row of rows) {
    const key = row.status as keyof BatchStatusCounts;
    if (key in counts) counts[key] = Number(row.count);
  }
  return counts;
}

export async function getParentBatchProgress(parentBatchId: string): Promise<ParentBatchProgress | null> {
  const batch = await getParentBatch(parentBatchId);
  if (!batch) return null;
  const counts = await countProspectsForParentBatch(parentBatchId);
  return {
    requested: batch.requested_prospect_count,
    imported: batch.imported_count,
    counts,
    sourceExhausted: batch.source_exhausted,
    replacementUsed: batch.replacement_used,
  };
}

function sumCounts(counts: BatchStatusCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export async function refreshParentBatchCounters(parentBatchId: string): Promise<ParentBatch | null> {
  const counts = await countProspectsForParentBatch(parentBatchId);
  const imported = sumCounts(counts);
  const [activity] = await query<{ last_at: string | null }>(
    `SELECT MAX(updated_at)::text AS last_at FROM prospects WHERE parent_batch_id = $1`,
    [parentBatchId]
  );
  const row = await queryOne<ParentBatch>(
    `UPDATE parent_batches
        SET imported_count = $2,
            delivered_count = $3,
            excluded_thin_research = $4,
            failed_count = $5,
            last_prospect_activity_at = COALESCE($6::timestamptz, last_prospect_activity_at)
      WHERE id = $1
      RETURNING *`,
    [
      parentBatchId,
      imported,
      counts.delivered,
      counts.thin_research,
      counts.research_failed + counts.qa_failed + counts.personalization_failed + counts.dead_letter,
      activity?.last_at ?? null,
    ]
  );
  return row ?? null;
}

export async function getLastProspectActivityAt(parentBatchId: string): Promise<Date | null> {
  const [row] = await query<{ last_at: string | null }>(
    `SELECT MAX(updated_at)::text AS last_at FROM prospects WHERE parent_batch_id = $1`,
    [parentBatchId]
  );
  return row?.last_at ? new Date(row.last_at) : null;
}

export async function incrementSourceMissStreak(parentBatchId: string): Promise<number> {
  const [row] = await query<{ streak: string }>(
    `UPDATE parent_batches
        SET source_miss_streak = source_miss_streak + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING source_miss_streak::text AS streak`,
    [parentBatchId]
  );
  return Number(row?.streak ?? 0);
}

export async function resetSourceMissStreak(parentBatchId: string): Promise<void> {
  await query(`UPDATE parent_batches SET source_miss_streak = 0 WHERE id = $1`, [parentBatchId]);
}

export async function tagProspectsWithParentBatch(
  prospectIds: string[],
  parentBatchId: string
): Promise<number> {
  if (prospectIds.length === 0) return 0;
  const rows = await query<{ id: string }>(
    `UPDATE prospects
        SET parent_batch_id = $1, updated_at = NOW()
      WHERE id = ANY($2::uuid[])
        AND (parent_batch_id IS NULL OR parent_batch_id = $1)
      RETURNING id`,
    [parentBatchId, prospectIds]
  );
  return rows.length;
}

export async function incrementParentBatchChunk(parentBatchId: string): Promise<void> {
  await query(
    `UPDATE parent_batches SET current_chunk = current_chunk + 1, updated_at = NOW() WHERE id = $1`,
    [parentBatchId]
  );
}

export async function markParentBatchSourceExhausted(parentBatchId: string): Promise<void> {
  await query(
    `UPDATE parent_batches SET source_exhausted = true, updated_at = NOW() WHERE id = $1`,
    [parentBatchId]
  );
  await logBatchEvent({
    parentBatchId,
    eventType: 'source_exhausted',
    message: 'No more replacement prospects available from configured sources',
  });
}

export async function markParentBatchReplacementUsed(parentBatchId: string): Promise<void> {
  await query(
    `UPDATE parent_batches SET replacement_used = true, updated_at = NOW() WHERE id = $1`,
    [parentBatchId]
  );
}

export async function completeParentBatch(
  parentBatchId: string,
  fields: {
    status: 'completed' | 'partial' | 'failed';
    deliveryId?: string | null;
    errorMessage?: string | null;
  }
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `UPDATE parent_batches
        SET status = $2,
            delivery_id = COALESCE($3, delivery_id),
            error_message = $4,
            completed_at = NOW(),
            updated_at = NOW()
      WHERE id = $1 AND status IN ('processing', 'delivering')
      RETURNING id`,
    [parentBatchId, fields.status, fields.deliveryId ?? null, fields.errorMessage ?? null]
  );
  if (!row) return false;
  await logBatchEvent({
    parentBatchId,
    eventType: 'parent_batch_completed',
    message: fields.errorMessage ?? `Status: ${fields.status}`,
    metadata: { delivery_id: fields.deliveryId, status: fields.status },
  });
  return true;
}

export async function resetParentBatchToProcessing(
  parentBatchId: string,
  reason: string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `UPDATE parent_batches
        SET status = 'processing',
            error_message = $2,
            updated_at = NOW()
      WHERE id = $1 AND status IN ('delivering', 'failed')
      RETURNING id`,
    [parentBatchId, reason.slice(0, 500)]
  );
  if (row) {
    await logBatchEvent({
      parentBatchId,
      eventType: 'parent_batch_reset_processing',
      message: reason,
    });
  }
  return Boolean(row);
}

/** Recover parent batches stuck in delivering after worker crash. */
export async function reapStuckParentBatches(stuckMinutes: number): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `UPDATE parent_batches
        SET status = 'processing',
            error_message = $2,
            updated_at = NOW()
      WHERE status = 'delivering'
        AND updated_at < NOW() - ($1::int * INTERVAL '1 minute')
      RETURNING id`,
    [stuckMinutes, `auto-reaped from delivering after ${stuckMinutes}m`]
  );
  for (const { id } of rows) {
    await logBatchEvent({
      parentBatchId: id,
      eventType: 'parent_batch_reaped',
      message: `Reaped from delivering after ${stuckMinutes} minutes`,
    });
  }
  return rows.map((r) => r.id);
}

export async function markParentBatchDelivering(parentBatchId: string): Promise<boolean> {
  const [row] = await query<{ id: string }>(
    `UPDATE parent_batches
        SET status = 'delivering', updated_at = NOW()
      WHERE id = $1 AND status = 'processing'
      RETURNING id`,
    [parentBatchId]
  );
  return Boolean(row);
}

export async function markParentBatchStalled(parentBatchId: string, reason?: string): Promise<void> {
  await query(
    `UPDATE parent_batches
        SET status = 'stalled',
            error_message = COALESCE($2, error_message),
            updated_at = NOW()
      WHERE id = $1 AND status IN ('processing', 'delivering')`,
    [parentBatchId, reason?.slice(0, 500) ?? null]
  );
  if (reason) {
    await logBatchEvent({
      parentBatchId,
      eventType: 'parent_batch_stalled',
      message: reason,
    });
  }
}

export async function resumeParentBatch(parentBatchId: string): Promise<ParentBatch | null> {
  const row = await queryOne<ParentBatch>(
    `UPDATE parent_batches
        SET status = 'processing',
            stall_alerted_at = NULL,
            error_message = NULL,
            source_miss_streak = 0,
            updated_at = NOW()
      WHERE id = $1 AND status IN ('stalled', 'failed', 'delivering')
      RETURNING *`,
    [parentBatchId]
  );
  if (row) {
    await logBatchEvent({
      parentBatchId,
      eventType: 'parent_batch_resumed',
      message: 'Batch manually resumed',
    });
  }
  return row;
}

export async function recordStallAlert(parentBatchId: string): Promise<void> {
  await query(
    `UPDATE parent_batches SET stall_alerted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [parentBatchId]
  );
}

export interface BatchEventInput {
  parentBatchId?: string | null;
  prospectId?: string | null;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logBatchEvent(input: BatchEventInput): Promise<void> {
  await query(
    `INSERT INTO batch_events (parent_batch_id, prospect_id, event_type, from_status, to_status, message, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      input.parentBatchId ?? null,
      input.prospectId ?? null,
      input.eventType,
      input.fromStatus ?? null,
      input.toStatus ?? null,
      input.message?.slice(0, 1000) ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  ).catch((e) => console.error('[parent-batch] event log failed:', (e as Error).message));
}

export interface ParentBatchDashboardRow extends ParentBatch {
  progress: BatchStatusCounts;
  percent_complete: number;
  pipeline_active: number;
  ready_to_deliver: number;
}

export async function getParentBatchDashboard(parentBatchId: string): Promise<ParentBatchDashboardRow | null> {
  const batch = await getParentBatch(parentBatchId);
  if (!batch) return null;
  const progress = await countProspectsForParentBatch(parentBatchId);
  const pbProgress: ParentBatchProgress = {
    requested: batch.requested_prospect_count,
    imported: batch.imported_count,
    counts: progress,
    sourceExhausted: batch.source_exhausted,
    replacementUsed: batch.replacement_used,
  };
  return {
    ...batch,
    progress,
    percent_complete: percentComplete(pbProgress),
    pipeline_active: pipelineActiveCount(progress),
    ready_to_deliver: progress.personalized_qa_passed,
  };
}

export function buildProgressSummary(batch: ParentBatch, counts: BatchStatusCounts): Record<string, number> {
  return {
    requested: batch.requested_prospect_count,
    imported: batch.imported_count,
    queued: counts.queued,
    researching: counts.research_in_progress,
    research_complete: counts.research_complete,
    thin_research: counts.thin_research,
    personalized: counts.personalized_qa_passed,
    qa_passed: counts.personalized_qa_passed,
    delivered: counts.delivered,
    retrying: counts.research_failed + counts.qa_failed + counts.personalization_failed,
    permanently_failed: counts.dead_letter,
    excluded: excludedCount(counts),
    failed: failedTerminalCount(counts),
    current_chunk: batch.current_chunk,
  };
}

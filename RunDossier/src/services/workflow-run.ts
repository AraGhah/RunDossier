import { query, queryOne } from '../db.js';

export type WorkflowRunStage =
  | 'queued'
  | 'searching'
  | 'scheduling'
  | 'researching'
  | 'personalizing'
  | 'delivering'
  | 'completed'
  | 'failed';

export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface WorkflowRun {
  id: string;
  trigger_source: string;
  trigger_ref: string | null;
  status: WorkflowRunStatus;
  stage: WorkflowRunStage;
  prospects_found: number;
  prospects_ingested: number;
  prospects_skipped: number;
  prospects_delivered: number;
  prospects_thin_research: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  started_at: Date;
  completed_at: Date | null;
}

export interface CreateWorkflowRunInput {
  triggerSource?: string;
  triggerRef?: string;
}

export const STALE_WORKFLOW_RUN_MINUTES = 30;

export function isWorkflowRunStale(startedAt: Date, now = new Date()): boolean {
  const ageMs = now.getTime() - startedAt.getTime();
  return ageMs > STALE_WORKFLOW_RUN_MINUTES * 60_000;
}

/** Mark workflow runs stuck in 'running' as failed so Telegram /run can proceed. */
export async function reapStaleWorkflowRuns(): Promise<number> {
  const rows = await query<{ id: string }>(
    `UPDATE workflow_runs
     SET status = 'failed', stage = 'failed',
         error_message = 'stale run reaped after ${STALE_WORKFLOW_RUN_MINUTES}m',
         completed_at = NOW()
     WHERE status = 'running'
       AND started_at < NOW() - INTERVAL '${STALE_WORKFLOW_RUN_MINUTES} minutes'
     RETURNING id`
  );
  return rows.length;
}

export async function getActiveWorkflowRun(): Promise<WorkflowRun | null> {
  await reapStaleWorkflowRuns();
  const row = await queryOne<WorkflowRun>(
    `SELECT id, trigger_source, trigger_ref, status, stage,
            prospects_found, prospects_ingested, prospects_skipped,
            prospects_delivered, prospects_thin_research,
            error_message, metadata, started_at, completed_at
     FROM workflow_runs
     WHERE status = 'running'
     ORDER BY started_at DESC
     LIMIT 1`
  );
  return row ?? null;
}

export async function createWorkflowRun(input: CreateWorkflowRunInput = {}): Promise<WorkflowRun> {
  const row = await queryOne<WorkflowRun>(
    `INSERT INTO workflow_runs (trigger_source, trigger_ref, status, stage)
     VALUES ($1, $2, 'running', 'queued')
     RETURNING id, trigger_source, trigger_ref, status, stage,
               prospects_found, prospects_ingested, prospects_skipped,
               prospects_delivered, prospects_thin_research,
               error_message, metadata, started_at, completed_at`,
    [input.triggerSource ?? 'telegram', input.triggerRef ?? null]
  );
  if (!row) throw new Error('Failed to create workflow run');
  return row;
}

export async function updateWorkflowRun(
  runId: string,
  fields: Partial<{
    stage: WorkflowRunStage;
    status: WorkflowRunStatus;
    prospects_found: number;
    prospects_ingested: number;
    prospects_skipped: number;
    prospects_delivered: number;
    prospects_thin_research: number;
    error_message: string | null;
    metadata: Record<string, unknown>;
    completed: boolean;
  }>
): Promise<void> {
  const allowedColumns = new Set([
    'stage',
    'status',
    'prospects_found',
    'prospects_ingested',
    'prospects_skipped',
    'prospects_delivered',
    'prospects_thin_research',
    'error_message',
    'metadata',
  ]);

  const sets: string[] = [];
  const values: unknown[] = [runId];
  let i = 2;

  for (const [key, value] of Object.entries(fields)) {
    if (key === 'completed') continue;
    if (value === undefined) continue;
    if (!allowedColumns.has(key)) continue;
    if (key === 'metadata') {
      sets.push(`metadata = metadata || $${i}::jsonb`);
      values.push(JSON.stringify(value));
    } else {
      sets.push(`${key} = $${i}`);
      values.push(value);
    }
    i += 1;
  }

  if (fields.completed) {
    sets.push(`completed_at = NOW()`);
  }

  if (sets.length === 0) return;

  await query(`UPDATE workflow_runs SET ${sets.join(', ')} WHERE id = $1`, values);
}

export async function getLatestWorkflowRunId(): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM workflow_runs ORDER BY started_at DESC LIMIT 1`
  );
  return row?.id ?? '';
}

export async function countThinResearch(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects WHERE trim(status) = 'thin_research'`
  );
  return Number(row?.count ?? 0);
}

export async function getPipelineCounts(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; count: string }>(
    `SELECT trim(status) AS status, COUNT(*)::text AS count
     FROM prospects WHERE client_id IS NOT NULL
     GROUP BY trim(status)`
  );
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}

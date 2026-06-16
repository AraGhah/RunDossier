import { query } from '../db.js';
import { retriggerPersonalize, retriggerResearch } from './prospect.service.js';

export interface FailedJobRow {
  id: string;
  workflow: string;
  entity_id: string | null;
  error: string;
  retry_count: number;
  created_at: string;
}

export interface ListFailedJobsOptions {
  workflow?: string;
  limit?: number;
  offset?: number;
}

function clampPagination(limit?: number, offset?: number): { limit: number; offset: number } {
  const safeLimit = Math.min(200, Math.max(1, limit ?? 50));
  const safeOffset = Math.max(0, offset ?? 0);
  return { limit: safeLimit, offset: safeOffset };
}

export async function listFailedJobs(options: ListFailedJobsOptions = {}): Promise<{
  total: number;
  jobs: FailedJobRow[];
}> {
  const { limit, offset } = clampPagination(options.limit, options.offset);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.workflow) {
    params.push(options.workflow);
    conditions.push(`workflow = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRow] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM failed_jobs ${where}`,
    params
  );

  params.push(limit, offset);
  const jobs = await query<FailedJobRow>(
    `SELECT id, workflow, entity_id, error, retry_count, created_at
     FROM failed_jobs
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { total: parseInt(countRow?.count ?? '0', 10), jobs };
}

export async function retryFailedJob(failedJobId: string): Promise<{
  ok: true;
  workflow: string;
  entityId: string | null;
  action: string;
}> {
  const [job] = await query<FailedJobRow>(
    `SELECT id, workflow, entity_id, error, retry_count, created_at
     FROM failed_jobs
     WHERE id = $1`,
    [failedJobId]
  );
  if (!job) {
    throw new Error('Failed job not found');
  }

  const workflow = job.workflow.toLowerCase();

  if (workflow === 'research') {
    if (!job.entity_id) {
      throw new Error('Failed job has no entity_id for research retry');
    }
    await retriggerResearch(job.entity_id);
    return { ok: true, workflow: job.workflow, entityId: job.entity_id, action: 'research_enqueued' };
  }

  if (workflow === 'personalize') {
    if (!job.entity_id) {
      throw new Error('Failed job has no entity_id for personalize retry');
    }
    await retriggerPersonalize(job.entity_id);
    return { ok: true, workflow: job.workflow, entityId: job.entity_id, action: 'personalize_enqueued' };
  }

  throw new Error(`Workflow "${job.workflow}" cannot be retried automatically`);
}

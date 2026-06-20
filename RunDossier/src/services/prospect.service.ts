import { query } from '../db.js';
import { getBoss } from '../queue.js';
import {
  ingestProspects,
  normalizeIntakeRecord,
  type IntakeRecord,
  type IntakeResult,
  type IngestOptions,
} from './intake.js';

export { normalizeIntakeRecord, type IntakeRecord, type IntakeResult };

export interface ListProspectsOptions {
  status?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}

export interface ProspectRow {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  email: string | null;
  status: string;
  client_id: string | null;
  batch_id: string | null;
  source: string | null;
  confidence_score: number | null;
  created_at: string;
}

export interface ProspectDetail extends ProspectRow {
  research_summary: string | null;
  top_3_signals: unknown;
  buying_triggers: unknown;
  first_lines: Record<string, unknown>[];
  signals: Record<string, unknown>[];
}

export interface BatchProgress {
  id: string;
  client_id: string;
  prospect_count: number;
  status: string;
  created_at: string;
  status_counts: Record<string, number>;
}

const RESEARCH_RETRY_OPTIONS = {
  singletonKey: (id: string) => `research-${id}`,
  retryLimit: 3,
  retryBackoff: true,
} as const;

const PERSONALIZE_RETRY_OPTIONS = {
  singletonKey: (id: string) => `personalize-${id}`,
  retryLimit: 3,
  retryBackoff: true,
} as const;

function clampPagination(limit?: number, offset?: number): { limit: number; offset: number } {
  const safeLimit = Math.min(200, Math.max(1, limit ?? 50));
  const safeOffset = Math.max(0, offset ?? 0);
  return { limit: safeLimit, offset: safeOffset };
}

export async function listProspects(options: ListProspectsOptions = {}): Promise<{
  total: number;
  prospects: ProspectRow[];
}> {
  const { limit, offset } = clampPagination(options.limit, options.offset);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.status) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.clientId) {
    params.push(options.clientId);
    conditions.push(`client_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRow] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects ${where}`,
    params
  );

  params.push(limit, offset);
  const prospects = await query<ProspectRow>(
    `SELECT id, name, title, company, linkedin_url, email, status,
            client_id, batch_id, source, confidence_score, created_at
     FROM prospects
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { total: parseInt(countRow?.count ?? '0', 10), prospects };
}

export async function getProspectById(id: string): Promise<ProspectDetail | null> {
  const [prospect] = await query<ProspectDetail>(
    `SELECT id, name, title, company, linkedin_url, email, status,
            client_id, batch_id, source, confidence_score, created_at,
            research_summary, top_3_signals, buying_triggers
     FROM prospects
     WHERE id = $1`,
    [id]
  );
  if (!prospect) return null;

  const first_lines = await query<Record<string, unknown>>(
    `SELECT id, variant_number, subject, opener, bridge, angle,
            qa_score, qa_verdict, status, is_chosen, created_at
     FROM first_lines
     WHERE prospect_id = $1
     ORDER BY variant_number`,
    [id]
  );

  const signals = await query<Record<string, unknown>>(
    `SELECT id, source, created_at
     FROM prospect_signals_raw
     WHERE prospect_id = $1
     ORDER BY created_at`,
    [id]
  );

  return { ...prospect, first_lines, signals };
}

export const RESEARCH_RETRIGGER_ALLOWED = new Set([
  'queued',
  'research_failed',
  'thin_research',
  'research_complete',
  'qa_failed',
  'personalization_failed',
]);

export const RESEARCH_RETRIGGER_BLOCKED = new Set([
  'delivered',
  'delivering',
  'personalized_qa_passed',
  'research_in_progress',
  'personalization_in_progress',
]);

export function validateResearchRetriggerStatus(status: string): void {
  const normalized = status.trim();
  if (RESEARCH_RETRIGGER_BLOCKED.has(normalized)) {
    throw new Error(`Cannot re-research while status is ${normalized}`);
  }
  if (!RESEARCH_RETRIGGER_ALLOWED.has(normalized)) {
    throw new Error(`Cannot re-research from status ${normalized}`);
  }
}

export async function retriggerResearch(prospectId: string): Promise<{ ok: true; status: string }> {
  const [prospect] = await query<{ id: string; status: string }>(
    `SELECT id, trim(status) AS status FROM prospects WHERE id = $1`,
    [prospectId]
  );
  if (!prospect) {
    throw new Error('Prospect not found');
  }

  validateResearchRetriggerStatus(prospect.status);

  const [claimed] = await query<{ id: string }>(
    `UPDATE prospects SET status = 'research_in_progress', updated_at = NOW()
     WHERE id = $1 AND trim(status) = $2
     RETURNING id`,
    [prospectId, prospect.status]
  );
  if (!claimed) {
    throw new Error('Failed to claim prospect for research');
  }

  const boss = getBoss();
  try {
    await boss.send(
      'research',
      { prospectId },
      {
        singletonKey: RESEARCH_RETRY_OPTIONS.singletonKey(prospectId),
        retryLimit: RESEARCH_RETRY_OPTIONS.retryLimit,
        retryBackoff: RESEARCH_RETRY_OPTIONS.retryBackoff,
      }
    );
  } catch (err) {
    await query(
      `UPDATE prospects SET status = 'queued' WHERE id = $1`,
      [prospectId]
    );
    throw err;
  }

  return { ok: true, status: 'research_in_progress' };
}

export async function retriggerPersonalize(prospectId: string): Promise<{ ok: true; status: string }> {
  const [prospect] = await query<{ id: string; status: string }>(
    `SELECT id, status FROM prospects WHERE id = $1`,
    [prospectId]
  );
  if (!prospect) {
    throw new Error('Prospect not found');
  }

  const allowed = new Set([
    'research_complete',
    'qa_failed',
    'personalization_failed',
    'personalized_qa_passed',
  ]);
  if (!allowed.has(prospect.status)) {
    throw new Error(`Cannot re-personalize from status ${prospect.status}`);
  }

  const [claimed] = await query<{ id: string }>(
    `UPDATE prospects SET status = 'personalization_in_progress'
     WHERE id = $1
     RETURNING id`,
    [prospectId]
  );
  if (!claimed) {
    throw new Error('Failed to claim prospect for personalization');
  }

  const boss = getBoss();
  try {
    await boss.send(
      'personalize',
      { prospectId },
      {
        singletonKey: PERSONALIZE_RETRY_OPTIONS.singletonKey(prospectId),
        retryLimit: PERSONALIZE_RETRY_OPTIONS.retryLimit,
        retryBackoff: PERSONALIZE_RETRY_OPTIONS.retryBackoff,
      }
    );
  } catch (err) {
    await query(
      `UPDATE prospects SET status = 'research_complete' WHERE id = $1`,
      [prospectId]
    );
    throw err;
  }

  return { ok: true, status: 'personalization_in_progress' };
}

export async function importProspects(
  records: IntakeRecord[],
  options?: IngestOptions
): Promise<IntakeResult> {
  return ingestProspects(records, options);
}

export async function getBatchById(batchId: string): Promise<BatchProgress | null> {
  const [batch] = await query<{
    id: string;
    client_id: string;
    prospect_count: number;
    status: string;
    created_at: string;
  }>(
    `SELECT id, client_id, prospect_count, status, created_at
     FROM batches
     WHERE id = $1`,
    [batchId]
  );
  if (!batch) return null;

  const counts = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM prospects
     WHERE batch_id = $1
     GROUP BY status
     ORDER BY status`,
    [batchId]
  );

  const status_counts: Record<string, number> = {};
  for (const row of counts) {
    status_counts[row.status] = parseInt(row.count, 10);
  }

  return { ...batch, status_counts };
}

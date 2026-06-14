import { query } from '../db.js';
import { config } from '../config.js';

const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[a-z0-9_%-]{3,100}\/?(\?[^\s]*)?$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEFAULT_CLIENT_ID = 'cd435b0e-6767-499f-99cd-c42a14a18a35';

export interface IntakeRecord {
  name: string;
  linkedin_url?: string;
  email?: string;
  title?: string;
  company?: string;
  client_id: string;
}

export interface IntakeResult {
  inserted: number;
  skipped: number;
  invalid: number;
  batchIds: string[];
}

function normalizeLinkedInUrl(raw: string): string {
  let url = raw.trim().toLowerCase();
  if (!url.startsWith('http')) url = `https://${url}`;
  url = url.replace(/^http:\/\//i, 'https://');
  try {
    const parsed = new URL(url);
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.replace(/^linkedin\.com$/i, 'www.linkedin.com');
    parsed.hash = '';
    const path = parsed.pathname.replace(/\/+$/, '') || parsed.pathname;
    return `https://www.linkedin.com${path.startsWith('/') ? path : `/${path}`}${parsed.search}`;
  } catch {
    return url;
  }
}

export function normalizeIntakeRecord(raw: Record<string, unknown>): IntakeRecord {
  const name = String(raw.name ?? '').trim();
  const linkedin_url = raw.linkedin_url != null && String(raw.linkedin_url).trim()
    ? normalizeLinkedInUrl(String(raw.linkedin_url))
    : undefined;
  const email = raw.email != null && String(raw.email).trim()
    ? String(raw.email).trim().toLowerCase()
    : undefined;
  const title = raw.title != null ? String(raw.title).trim() || undefined : undefined;
  const company = raw.company != null ? String(raw.company).trim() || undefined : undefined;
  const client_id = String(raw.client_id ?? DEFAULT_CLIENT_ID).trim();

  return { name, linkedin_url, email, title, company, client_id };
}

export function validateIntakeRecord(record: IntakeRecord): string | null {
  if (!record.name) return 'name is required';
  if (!record.client_id) return 'client_id is required';
  if (!record.linkedin_url && !record.email) {
    return 'linkedin_url or email is required';
  }
  if (record.linkedin_url && !LINKEDIN_PROFILE_RE.test(record.linkedin_url)) {
    return `invalid linkedin_url: ${record.linkedin_url}`;
  }
  if (record.email && !EMAIL_RE.test(record.email)) {
    return `invalid email: ${record.email}`;
  }
  return null;
}

async function logIntakeFailure(error: string, record: IntakeRecord): Promise<void> {
  await query(
    `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
     VALUES ('W2 - Prospect Intake', NULL, $1, 0)`,
    [`${error} — ${JSON.stringify(record)}`]
  ).catch(e => console.error('[intake] failed_jobs insert error:', e));
}

export async function ingestProspects(records: IntakeRecord[]): Promise<IntakeResult> {
  const valid: IntakeRecord[] = [];
  let invalid = 0;
  let skipped = 0;

  for (const raw of records) {
    const record = normalizeIntakeRecord(raw as unknown as Record<string, unknown>);
    const err = validateIntakeRecord(record);
    if (err) {
      invalid += 1;
      await logIntakeFailure(err, record);
      continue;
    }
    valid.push(record);
  }

  if (valid.length === 0) {
    return { inserted: 0, skipped, invalid, batchIds: [] };
  }

  const byClient = new Map<string, IntakeRecord[]>();
  for (const r of valid) {
    const list = byClient.get(r.client_id) ?? [];
    list.push(r);
    byClient.set(r.client_id, list);
  }

  const batchIds: string[] = [];
  let inserted = 0;

  for (const [clientId, clientRecords] of byClient) {
    for (let i = 0; i < clientRecords.length; i += config.intakeBatchSize) {
      const chunk = clientRecords.slice(i, i + config.intakeBatchSize);

      const [batch] = await query<{ id: string }>(
        `INSERT INTO batches (client_id, prospect_count, status)
         VALUES ($1, $2, 'queued')
         RETURNING id`,
        [clientId, chunk.length]
      );
      if (!batch) continue;
      batchIds.push(batch.id);

      for (const p of chunk) {
        if (p.linkedin_url) {
          const [existing] = await query<{ id: string; status: string }>(
            `SELECT id, status FROM prospects
             WHERE client_id = $1 AND linkedin_url = $2 LIMIT 1`,
            [clientId, p.linkedin_url]
          );
          if (existing) {
            skipped += 1;
            continue;
          }
        }

        await query(
          `INSERT INTO prospects (name, title, company, linkedin_url, email, client_id, batch_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued')`,
          [
            p.name,
            p.title ?? null,
            p.company ?? null,
            p.linkedin_url ?? null,
            p.email ?? null,
            clientId,
            batch.id,
          ]
        );
        inserted += 1;
      }
    }
  }

  return { inserted, skipped, invalid, batchIds };
}

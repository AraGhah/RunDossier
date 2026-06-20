import { query } from '../db.js';
import { config } from '../config.js';
import { containsMarkup, sanitizeEmail, sanitizeText } from '../utils/sanitize.js';

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
  employee_count?: number | null;
  icp_fit_score?: number | null;
}

export interface IntakeResult {
  inserted: number;
  skipped: number;
  invalid: number;
  batchIds: string[];
  prospectIds: string[];
}

export interface IngestOptions {
  source?: 'manual' | 'search' | 'dogfood';
}

function normalizeNameCompany(name: string, company?: string): { nameKey: string; companyKey: string } {
  return {
    nameKey: name.trim().toLowerCase().replace(/\s+/g, ' '),
    companyKey: (company ?? '').trim().toLowerCase().replace(/\s+/g, ' '),
  };
}

export function nameCompanyDedupeKey(name: string, company?: string): string {
  const { nameKey, companyKey } = normalizeNameCompany(name, company);
  return `${nameKey}|${companyKey}`;
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
  const name = sanitizeText(raw.name, 200);
  const linkedin_url = raw.linkedin_url != null && String(raw.linkedin_url).trim()
    ? normalizeLinkedInUrl(sanitizeText(raw.linkedin_url, 2048))
    : undefined;
  const email = raw.email != null ? sanitizeEmail(raw.email) || undefined : undefined;
  const title = raw.title != null ? sanitizeText(raw.title, 200) || undefined : undefined;
  const company = raw.company != null ? sanitizeText(raw.company, 200) || undefined : undefined;
  const client_id = sanitizeText(raw.client_id ?? DEFAULT_CLIENT_ID, 64) || DEFAULT_CLIENT_ID;

  if (name && containsMarkup(name)) {
    throw new Error('Invalid characters in name');
  }
  if (title && containsMarkup(title)) {
    throw new Error('Invalid characters in title');
  }
  if (company && containsMarkup(company)) {
    throw new Error('Invalid characters in company');
  }

  return { name, linkedin_url, email, title, company, client_id };
}

export function validateIntakeRecord(record: IntakeRecord): string | null {
  if (!record.name) return 'name is required';
  if (!record.client_id) return 'client_id is required';
  if (!record.linkedin_url) {
    return 'linkedin_url is required for the research pipeline (W3)';
  }
  if (!LINKEDIN_PROFILE_RE.test(record.linkedin_url)) {
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

export async function ingestProspects(
  records: IntakeRecord[],
  options: IngestOptions = {}
): Promise<IntakeResult> {
  const source = options.source ?? 'manual';
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
    return { inserted: 0, skipped, invalid, batchIds: [], prospectIds: [] };
  }

  const byClient = new Map<string, IntakeRecord[]>();
  for (const r of valid) {
    const list = byClient.get(r.client_id) ?? [];
    list.push(r);
    byClient.set(r.client_id, list);
  }

  const batchIds: string[] = [];
  const prospectIds: string[] = [];
  let inserted = 0;

  for (const [clientId, clientRecords] of byClient) {
    const [client] = await query<{ id: string }>(
      `SELECT id FROM clients WHERE id = $1`,
      [clientId]
    );
    if (!client) {
      for (const p of clientRecords) {
        invalid += 1;
        await logIntakeFailure(`unknown client_id: ${clientId}`, p);
      }
      continue;
    }

    for (let i = 0; i < clientRecords.length; i += config.intakeBatchSize) {
      const chunk = clientRecords.slice(i, i + config.intakeBatchSize);

      const [batch] = await query<{ id: string }>(
        `INSERT INTO batches (client_id, prospect_count, status)
         VALUES ($1, 0, 'queued')
         RETURNING id`,
        [clientId]
      );
      if (!batch) continue;
      batchIds.push(batch.id);

      let batchInserted = 0;
      for (const p of chunk) {
        if (p.linkedin_url) {
          const [existing] = await query<{ id: string; status: string }>(
            `SELECT id, status FROM prospects
             WHERE client_id = $1 AND linkedin_url = $2 LIMIT 1`,
            [clientId, p.linkedin_url]
          );
          if (existing) {
            skipped += 1;
            await logIntakeFailure(`duplicate linkedin_url (status: ${existing.status})`, p);
            continue;
          }

          const [recentDelivered] = await query<{ id: string }>(
            `SELECT id FROM prospects
             WHERE client_id = $1 AND linkedin_url = $2
               AND status = 'delivered'
               AND delivered_at >= NOW() - INTERVAL '90 days'
             LIMIT 1`,
            [clientId, p.linkedin_url]
          );
          if (recentDelivered) {
            skipped += 1;
            await logIntakeFailure('recently delivered prospect (90d dedup)', p);
            continue;
          }
        }

        if (p.email) {
          const [existingEmail] = await query<{ id: string }>(
            `SELECT id FROM prospects
             WHERE client_id = $1 AND lower(email) = $2 LIMIT 1`,
            [clientId, p.email]
          );
          if (existingEmail) {
            skipped += 1;
            await logIntakeFailure('duplicate email', p);
            continue;
          }
        }

        if (p.name && p.company) {
          const { nameKey, companyKey } = normalizeNameCompany(p.name, p.company);
          const [existingNc] = await query<{ id: string; status: string }>(
            `SELECT id, status FROM prospects
             WHERE client_id = $1
               AND lower(trim(name)) = $2
               AND lower(trim(coalesce(company, ''))) = $3
             LIMIT 1`,
            [clientId, nameKey, companyKey]
          );
          if (existingNc) {
            skipped += 1;
            await logIntakeFailure(`duplicate name+company (status: ${existingNc.status})`, p);
            continue;
          }
        }

        const [row] = await query<{ id: string }>(
          `INSERT INTO prospects (name, title, company, linkedin_url, email, client_id, batch_id, status, source, employee_count, icp_fit_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', $8, $9, $10)
           RETURNING id`,
          [
            p.name,
            p.title ?? null,
            p.company ?? null,
            p.linkedin_url ?? null,
            p.email ?? null,
            clientId,
            batch.id,
            source,
            p.employee_count ?? null,
            p.icp_fit_score ?? null,
          ]
        );
        if (row?.id) prospectIds.push(row.id);
        inserted += 1;
        batchInserted += 1;
      }

      if (batchInserted > 0) {
        await query(
          `UPDATE batches SET prospect_count = $1 WHERE id = $2`,
          [batchInserted, batch.id]
        );
      }
    }
  }

  return { inserted, skipped, invalid, batchIds, prospectIds };
}

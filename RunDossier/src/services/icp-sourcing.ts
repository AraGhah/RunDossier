import { config } from '../config.js';
import { ingestProspects, normalizeIntakeRecord } from './intake.js';

const ACTOR = 'harvestapi~linkedin-profile-search';
const API = 'https://api.apify.com/v2';

async function apify(path: string, opts?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}token=${config.apifyToken}`, opts);
  if (!res.ok) throw new Error(`Apify ${opts?.method ?? 'GET'} ${path} -> ${res.status}`);
  return res.json();
}

export interface SourceIcpInput {
  clientId: string;
  query: string;
  location?: string;
  count?: number;
}

export interface SourceIcpResult {
  sourced: number;
  inserted: number;
  skipped: number;
  invalid: number;
}

/** Source matching LinkedIn profiles via Apify and ingest them for a client. */
export async function sourceAndIngestForClient(input: SourceIcpInput): Promise<SourceIcpResult> {
  if (!config.apifyToken) throw new Error('APIFY_TOKEN not configured');
  const target = Math.max(1, Math.min(200, input.count ?? 25));

  const apifyInput = {
    searchQuery: [input.query, input.location].filter(Boolean).join(' '),
    profileScraperMode: 'Short',
    maxItems: target,
    takePages: Math.ceil(target / 25) + 2,
  };

  const started = await apify(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(apifyInput),
  });
  const runId = started.data.id;
  const datasetId = started.data.defaultDatasetId;
  let status = started.data.status;

  const t0 = Date.now();
  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('Apify run timed out');
    await new Promise((r) => setTimeout(r, 5000));
    status = (await apify(`/actor-runs/${runId}`)).data.status;
  }
  if (status !== 'SUCCEEDED') throw new Error(`Apify run ${status}`);

  const items: any[] = await apify(`/datasets/${datasetId}/items?clean=true&limit=2000`);
  const seen = new Set<string>();
  const records = [];
  for (const it of items) {
    const pid = typeof it.publicIdentifier === 'string' ? it.publicIdentifier : '';
    const clean = pid && !/^AC[A-Za-z0-9_-]{12,}$/.test(pid);
    const url = clean
      ? `https://www.linkedin.com/in/${pid}`
      : it.linkedinUrl || (pid ? `https://www.linkedin.com/in/${pid}` : '');
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const name = it.name || [it.firstName, it.lastName].filter(Boolean).join(' ') || pid || 'Unknown';
    try {
      records.push(
        normalizeIntakeRecord({ name, linkedin_url: url, title: it.headline, client_id: input.clientId })
      );
    } catch {
      /* skip records that fail sanitisation */
    }
    if (records.length >= target) break;
  }

  if (records.length === 0) return { sourced: 0, inserted: 0, skipped: 0, invalid: 0 };
  const result = await ingestProspects(records);
  return { sourced: records.length, inserted: result.inserted, skipped: result.skipped, invalid: result.invalid };
}

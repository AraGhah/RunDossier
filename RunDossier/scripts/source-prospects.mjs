/**
 * Source ~100 ICP prospects via Apify and write scripts/prospects-100.json,
 * ready for `npm run ingest scripts/prospects-100.json`.
 *
 * Uses the harvestapi/linkedin-profile-search Actor (no LinkedIn cookie needed),
 * authenticated with your existing APIFY_TOKEN from .env — the same token
 * Preframe already uses for W3 research.
 *
 * Run from the RunDossier folder (plain Node, no tsx needed):
 *     node scripts/source-prospects.mjs
 *     node scripts/source-prospects.mjs "lead generation agency founder" "United States" 100
 *
 * Args (all optional): <searchQuery> <location> <target count>
 *
 * Cost: harvestapi charges ~$0.10 per 25-result search page in Short mode,
 * so ~100 profiles ≈ 4-6 pages ≈ a few dollars on YOUR Apify account.
 */
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error('Missing APIFY_TOKEN in .env (run this from the RunDossier folder).');
  process.exit(1);
}

const SEARCH_QUERY = process.argv[2] || 'lead generation agency founder';
const LOCATION = process.argv[3] || 'United States';
const TARGET = Number(process.argv[4] || 100);

const ACTOR = 'harvestapi~linkedin-profile-search';
const API = 'https://api.apify.com/v2';

// Only schema-confirmed fields. Location is folded into the free-text query to
// avoid sending an unverified filter key.
const input = {
  searchQuery: [SEARCH_QUERY, LOCATION].filter(Boolean).join(' '),
  profileScraperMode: 'Short',
  maxItems: TARGET,
  takePages: Math.ceil(TARGET / 25) + 2,
};

async function api(path, opts) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}token=${TOKEN}`, opts);
  if (!res.ok) throw new Error(`${opts?.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`[apify] searching: "${input.searchQuery}" (target ${TARGET})`);
  const started = await api(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const runId = started.data.id;
  const datasetId = started.data.defaultDatasetId;
  let status = started.data.status;

  const t0 = Date.now();
  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('Timed out after 12 min waiting for the run');
    await new Promise((r) => setTimeout(r, 5000));
    const r = await api(`/actor-runs/${runId}`);
    status = r.data.status;
    process.stdout.write(`\r[apify] run ${runId} status=${status} (${Math.round((Date.now() - t0) / 1000)}s)    `);
  }
  process.stdout.write('\n');
  if (status !== 'SUCCEEDED') throw new Error(`Actor run ended ${status}`);

  const items = await api(`/datasets/${datasetId}/items?clean=true&limit=2000`);
  const seen = new Set();
  const prospects = [];
  for (const it of items) {
    // Prefer a clean vanity handle; fall back to the (case-sensitive) encoded URL.
    const pid = typeof it.publicIdentifier === 'string' ? it.publicIdentifier : '';
    const cleanHandle = pid && !/^AC[A-Za-z0-9_-]{12,}$/.test(pid);
    const url = cleanHandle
      ? `https://www.linkedin.com/in/${pid}`
      : it.linkedinUrl || (pid ? `https://www.linkedin.com/in/${pid}` : null);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const name =
      it.name || [it.firstName, it.lastName].filter(Boolean).join(' ') || it.publicIdentifier || 'Unknown';
    const title = it.headline || it.position || it.currentPosition?.[0]?.title;
    const company = it.currentPosition?.[0]?.companyName || it.company;
    const row = { name, linkedin_url: url };
    if (title) row.title = String(title).slice(0, 200);
    if (company) row.company = String(company).slice(0, 200);
    prospects.push(row);
    if (prospects.length >= TARGET) break;
  }

  if (prospects.length === 0) {
    console.error('No profiles returned — try a broader searchQuery (arg 1) or different location (arg 2).');
    process.exit(2);
  }

  await writeFile(new URL('./prospects-100.json', import.meta.url), JSON.stringify(prospects, null, 2));
  console.log(`Wrote ${prospects.length} prospects -> scripts/prospects-100.json`);
  console.log('Next:  npm run ingest scripts/prospects-100.json');
}

main().catch((err) => {
  console.error('\n[error]', err.message);
  process.exit(1);
});

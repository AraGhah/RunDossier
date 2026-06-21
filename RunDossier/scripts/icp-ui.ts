/**
 * Simple local UI to launch an ICP sourcing run.
 *
 *   npx tsx scripts/icp-ui.ts        then open  http://127.0.0.1:4100
 *
 * Type an ICP (who + where + how many). It sources matching LinkedIn profiles
 * via Apify and ingests them into the queue; the always-on PM2 engine then
 * researches, personalizes, QA-checks and delivers them automatically.
 */
import 'dotenv/config';
import http from 'node:http';
import { validateConfig } from '../src/config.js';
import { ingestProspects, normalizeIntakeRecord, DEFAULT_CLIENT_ID } from '../src/services/intake.js';

const PORT = Number(process.env.ICP_UI_PORT) || 4100;
const TOKEN = process.env.APIFY_TOKEN ?? '';
const ACTOR = 'harvestapi~linkedin-profile-search';
const API = 'https://api.apify.com/v2';

async function apify(path: string, opts?: any): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}token=${TOKEN}`, opts);
  if (!res.ok) throw new Error(`Apify ${opts?.method ?? 'GET'} ${path} -> ${res.status}`);
  return res.json();
}

async function sourceProspects(query: string, location: string, target: number) {
  const input = {
    searchQuery: [query, location].filter(Boolean).join(' '),
    profileScraperMode: 'Short',
    maxItems: target,
    takePages: Math.ceil(target / 25) + 2,
  };
  const started = await apify(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
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
  const rows: Array<{ name: string; linkedin_url: string; title?: string }> = [];
  for (const it of items) {
    const pid = typeof it.publicIdentifier === 'string' ? it.publicIdentifier : '';
    const clean = pid && !/^AC[A-Za-z0-9_-]{12,}$/.test(pid);
    const url = clean
      ? `https://www.linkedin.com/in/${pid}`
      : it.linkedinUrl || (pid ? `https://www.linkedin.com/in/${pid}` : '');
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const name = it.name || [it.firstName, it.lastName].filter(Boolean).join(' ') || pid || 'Unknown';
    const title = it.headline || it.position;
    rows.push(title ? { name, linkedin_url: url, title } : { name, linkedin_url: url });
    if (rows.length >= target) break;
  }
  return rows;
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preframe - Launch an ICP</title>
<style>
  :root { color-scheme: dark; } * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif;
    background:#0b0f14; color:#e6edf3; display:flex; min-height:100vh; align-items:center; justify-content:center; }
  .card { width:min(560px,92vw); background:#11161d; border:1px solid #222c38; border-radius:16px; padding:28px; }
  h1 { font-size:20px; margin:0 0 4px; }
  p.sub { margin:0 0 20px; color:#9bb0c3; font-size:13px; line-height:1.5; }
  label { display:block; font-size:13px; margin:14px 0 6px; color:#c4d2e0; }
  input { width:100%; padding:11px 12px; border-radius:10px; border:1px solid #2a3848; background:#0d1219; color:#e6edf3; font-size:14px; }
  input:focus { outline:none; border-color:#3b82f6; }
  .row { display:flex; gap:12px; } .row > div { flex:1; }
  button { margin-top:20px; width:100%; padding:12px; border:0; border-radius:10px; background:#3b82f6; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:not-allowed; }
  .out { margin-top:18px; font-size:13px; white-space:pre-wrap; line-height:1.55; }
  .ok { color:#7ee787; } .err { color:#ff7b72; } .muted { color:#9bb0c3; }
</style></head>
<body><div class="card">
  <h1>Launch an ICP</h1>
  <p class="sub">Describe who to target. Preframe sources matching LinkedIn profiles, ingests them, and the engine researches and writes openers automatically.</p>
  <label>Who to target</label>
  <input id="query" placeholder="e.g. lead generation agency founder" />
  <div class="row">
    <div><label>Location</label><input id="location" placeholder="e.g. United States" /></div>
    <div><label>How many</label><input id="count" type="number" value="50" min="1" max="200" /></div>
  </div>
  <button id="go">Start sourcing</button>
  <div id="out" class="out"></div>
</div>
<script>
  var go = document.getElementById('go'), out = document.getElementById('out');
  go.onclick = async function () {
    var query = document.getElementById('query').value.trim();
    var location = document.getElementById('location').value.trim();
    var count = document.getElementById('count').value;
    if (!query) { out.className='out err'; out.textContent='Enter who to target first.'; return; }
    go.disabled = true; out.className='out muted';
    out.textContent = 'Sourcing "' + query + '"' + (location ? ' in ' + location : '') + ' ... this can take 1-3 minutes. Keep this tab open.';
    try {
      var res = await fetch('/run', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ query: query, location: location, count: count }) });
      var data = await res.json();
      if (data.ok) {
        out.className='out ok';
        out.textContent = 'Done. Sourced ' + data.sourced + ' profiles; queued ' + data.inserted + ' new (' + data.skipped + ' duplicates, ' + data.invalid + ' invalid). The engine is now researching them - watch with: pm2 logs preframe';
      } else { out.className='out err'; out.textContent = 'Error: ' + data.error; }
    } catch (e) { out.className='out err'; out.textContent = 'Request failed: ' + e.message; }
    finally { go.disabled = false; }
  };
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }
  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { query, location, count } = JSON.parse(body || '{}');
        const target = Math.max(1, Math.min(200, Number(count) || 50));
        if (!query || !String(query).trim()) throw new Error('Please enter who to target.');
        const sourced = await sourceProspects(String(query).trim(), String(location || '').trim(), target);
        if (sourced.length === 0) throw new Error('No profiles found - try broader wording or a different location.');
        const records = [];
        for (const r of sourced) {
          try { records.push(normalizeIntakeRecord({ ...r, client_id: DEFAULT_CLIENT_ID })); } catch {}
        }
        const result = await ingestProspects(records);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sourced: sourced.length, inserted: result.inserted, skipped: result.skipped, invalid: result.invalid }));
      } catch (e: any) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e?.message ?? String(e) }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

try { validateConfig(); } catch (e: any) { console.error('Config error:', e.message); process.exit(1); }
server.listen(PORT, '127.0.0.1', () => console.log('ICP UI ready -> http://127.0.0.1:' + PORT));

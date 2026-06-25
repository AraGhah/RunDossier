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

// Track active run so we can abort it via /cancel
let activeRunId: string | null = null;
let cancelled = false;

async function apify(path: string, opts?: any): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}token=${TOKEN}`, opts);
  if (!res.ok) throw new Error(`Apify ${opts?.method ?? 'GET'} ${path} -> ${res.status}`);
  return res.json();
}

async function abortActiveRun(): Promise<void> {
  if (!activeRunId) return;
  try {
    await apify(`/actor-runs/${activeRunId}/abort`, { method: 'POST' });
    console.log(`[icp-ui] Aborted Apify run ${activeRunId}`);
  } catch (e) {
    console.warn('[icp-ui] Abort failed:', (e as Error).message);
  }
  activeRunId = null;
}

async function sourceProspects(queries: string[], locations: string[], target: number) {
  const queryStr = queries.filter(Boolean).join(' OR ');
  const cleanLocations = locations.filter(Boolean);
  const input: Record<string, unknown> = {
    searchQuery: queryStr,
    profileScraperMode: 'Short',
    maxItems: target,
    takePages: Math.ceil(target / 25) + 2,
  };
  if (cleanLocations.length > 0) input['locations'] = cleanLocations;
  const started = await apify(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  activeRunId = started.data.id;
  const datasetId = started.data.defaultDatasetId;
  let status = started.data.status;
  const t0 = Date.now();
  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    if (cancelled) throw new Error('Cancelled by user');
    if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('Apify run timed out');
    await new Promise((r) => setTimeout(r, 5000));
    status = (await apify(`/actor-runs/${activeRunId}`)).data.status;
  }
  activeRunId = null;
  if (status === 'ABORTED') throw new Error('Cancelled by user');
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
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Preframe - Launch an ICP</title>
<style>
  :root{color-scheme:dark}*{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;
    background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px 0}
  .card{width:min(580px,94vw);background:#11161d;border:1px solid #222c38;border-radius:16px;padding:28px}
  h1{font-size:20px;margin:0 0 4px}
  p.sub{margin:0 0 20px;color:#9bb0c3;font-size:13px;line-height:1.5}
  .field-label{font-size:13px;margin:16px 0 6px;color:#c4d2e0;display:block}
  .input-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .input-row input{flex:1;padding:11px 12px;border-radius:10px;border:1px solid #2a3848;background:#0d1219;color:#e6edf3;font-size:14px}
  .input-row input:focus{outline:none;border-color:#3b82f6}
  .btn-add{width:32px;height:32px;border-radius:8px;border:1px solid #2a3848;background:#0d1219;color:#58a6ff;
    font-size:20px;line-height:1;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0}
  .btn-add:hover{background:#1a2a3a;border-color:#3b82f6}
  .btn-remove{width:32px;height:32px;border-radius:8px;border:1px solid #2a3848;background:#0d1219;color:#f85149;
    font-size:18px;line-height:1;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0}
  .btn-remove:hover{background:#2a1a1a;border-color:#f85149}
  .count-row{display:flex;align-items:center;gap:8px;margin-top:16px}
  .count-row label{font-size:13px;color:#c4d2e0;white-space:nowrap}
  .count-row input{width:100px;padding:11px 12px;border-radius:10px;border:1px solid #2a3848;background:#0d1219;color:#e6edf3;font-size:14px}
  .count-row input:focus{outline:none;border-color:#3b82f6}
  .btn-go{margin-top:20px;width:100%;padding:12px;border:0;border-radius:10px;background:#3b82f6;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
  .btn-go:hover:not(:disabled){background:#2563eb}
  .btn-go:disabled{opacity:.6;cursor:not-allowed}
  .btn-cancel{margin-top:10px;width:100%;padding:10px;border:1px solid #f85149;border-radius:10px;background:transparent;
    color:#f85149;font-size:14px;font-weight:600;cursor:pointer;display:none}
  .btn-cancel:hover{background:#2a1a1a}
  .out{margin-top:18px;font-size:13px;white-space:pre-wrap;line-height:1.55}
  .ok{color:#7ee787}.err{color:#ff7b72}.muted{color:#9bb0c3}
</style></head>
<body><div class="card">
  <h1>Launch an ICP</h1>
  <p class="sub">Describe who to target. Preframe sources matching LinkedIn profiles, ingests them, and the engine researches and writes openers automatically.</p>

  <label class="field-label">Who to target</label>
  <div id="queries">
    <div class="input-row">
      <input class="q-input" placeholder="e.g. lead generation agency founder"/>
      <button class="btn-add" title="Add another target" onclick="addRow('queries','q-input','e.g. marketing consultant')">+</button>
    </div>
  </div>

  <label class="field-label">Location</label>
  <div id="locations">
    <div class="input-row">
      <input class="l-input" placeholder="e.g. United States"/>
      <button class="btn-add" title="Add another location" onclick="addRow('locations','l-input','e.g. Canada')">+</button>
    </div>
  </div>

  <div class="count-row">
    <label>How many</label>
    <input id="count" type="number" value="50" min="1" max="500"/>
  </div>

  <button class="btn-go" id="go" onclick="startRun()">Start sourcing</button>
  <button class="btn-cancel" id="cancelBtn" onclick="cancelRun()">✕ Cancel request</button>
  <div id="out" class="out"></div>
</div>
<script>
  function addRow(containerId, inputClass, placeholder) {
    var container = document.getElementById(containerId);
    var lastRow = container.lastElementChild;
    // Replace the + on the last row with a - button
    var lastAdd = lastRow.querySelector('.btn-add');
    if (lastAdd) {
      var rm = document.createElement('button');
      rm.className = 'btn-remove';
      rm.title = 'Remove';
      rm.textContent = '×';
      rm.onclick = function(){ container.removeChild(rm.parentElement); };
      lastAdd.replaceWith(rm);
    }
    var row = document.createElement('div');
    row.className = 'input-row';
    var inp = document.createElement('input');
    inp.className = inputClass;
    inp.placeholder = placeholder || '';
    var addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.title = 'Add another';
    addBtn.textContent = '+';
    addBtn.onclick = function(){ addRow(containerId, inputClass, placeholder); };
    row.appendChild(inp);
    row.appendChild(addBtn);
    container.appendChild(row);
    inp.focus();
  }

  function getValues(inputClass) {
    return Array.from(document.querySelectorAll('.' + inputClass))
      .map(function(el){ return el.value.trim(); })
      .filter(Boolean);
  }

  var controller = null;

  async function startRun() {
    var queries = getValues('q-input');
    var locations = getValues('l-input');
    var count = document.getElementById('count').value;
    var out = document.getElementById('out');
    var go = document.getElementById('go');
    var cancelBtn = document.getElementById('cancelBtn');

    if (!queries.length) { out.className='out err'; out.textContent='Enter who to target first.'; return; }

    controller = new AbortController();
    go.disabled = true;
    cancelBtn.style.display = 'block';
    out.className = 'out muted';
    out.textContent = 'Sourcing "' + queries.join(', ') + '"' +
      (locations.length ? ' in ' + locations.join(', ') : '') +
      ' … this can take 1-3 minutes. Keep this tab open.';

    try {
      var res = await fetch('/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ queries: queries, locations: locations, count: count }),
        signal: controller.signal,
      });
      var data = await res.json();
      if (data.ok) {
        out.className = 'out ok';
        out.textContent = 'Done. Sourced ' + data.sourced + ' profiles; queued ' + data.inserted +
          ' new (' + data.skipped + ' duplicates, ' + data.invalid + ' invalid).\\nThe engine is now researching them — watch with: pm2 logs preframe';
      } else {
        out.className = 'out err';
        out.textContent = 'Error: ' + data.error;
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        out.className = 'out muted';
        out.textContent = 'Request cancelled.';
      } else {
        out.className = 'out err';
        out.textContent = 'Request failed: ' + e.message;
      }
    } finally {
      go.disabled = false;
      cancelBtn.style.display = 'none';
      controller = null;
    }
  }

  async function cancelRun() {
    if (controller) controller.abort();
    // Also tell the server to abort the Apify run
    try { await fetch('/cancel', { method: 'POST' }); } catch {}
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('go').disabled = false;
  }
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }

  if (req.method === 'POST' && req.url === '/cancel') {
    cancelled = true;
    void abortActiveRun().then(() => {
      cancelled = false;
    });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/run') {
    cancelled = false;
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { queries, locations, count } = JSON.parse(body || '{}');
        const queryList: string[] = Array.isArray(queries) ? queries : [String(queries || '')];
        const locationList: string[] = Array.isArray(locations) ? locations : [String(locations || '')];
        const target = Math.max(1, Math.min(500, Number(count) || 50));
        if (!queryList.filter(Boolean).length) throw new Error('Please enter who to target.');
        const sourced = await sourceProspects(queryList, locationList, target);
        if (sourced.length === 0) throw new Error('No profiles found — try broader wording or a different location.');
        const records: ReturnType<typeof normalizeIntakeRecord>[] = [];
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

function listen(port: number) {
  server.listen(port, '127.0.0.1', () => console.log('ICP UI ready -> http://127.0.0.1:' + port));
}

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    const next = (server.address() as any)?.port ?? PORT;
    console.warn(`Port ${next} in use, trying ${next + 1}…`);
    server.close();
    listen(next + 1);
  } else {
    throw err;
  }
});

listen(PORT);

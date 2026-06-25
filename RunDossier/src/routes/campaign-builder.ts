import { type Express, type Request, type Response } from 'express';
import {
  listCampaigns,
  getCampaign,
  getCampaignEvents,
  type Campaign,
  type CampaignEvent,
} from '../services/campaign.service.js';
import { query } from '../db.js';

const DEFAULT_CLIENT_ID = 'cd435b0e-6767-499f-99cd-c42a14a18a35';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] ?? c
  );
}

function checkToken(req: Request, res: Response): boolean {
  const token = req.query.token ?? req.headers['x-admin-token'];
  if (!process.env.DASHBOARD_TOKEN || token === process.env.DASHBOARD_TOKEN) return true;
  res.status(401).send(notice('Unauthorized', 'Pass ?token=DASHBOARD_TOKEN in the URL.'));
  return false;
}

function notice(title: string, body: string): string {
  return (
    '<!doctype html><meta charset="utf-8"><title>' + title + '</title>' +
    '<body style="font-family:system-ui,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">' +
    '<div style="max-width:460px;text-align:center;padding:24px"><h1 style="font-size:20px">' + esc(title) + '</h1>' +
    '<p style="color:#9bb0c3;line-height:1.6">' + body + '</p></div></body>'
  );
}

function statusBadge(status: string): string {
  const colors: Record<string, [string, string]> = {
    draft:                 ['#1a2a3a', '#58a6ff'],
    queued:                ['#1a3a1a', '#56d364'],
    running:               ['#003820', '#3fb950'],
    paused:                ['#3a2a00', '#d29922'],
    cancelling:            ['#3a1a00', '#f0883e'],
    cancelled:             ['#2a1a1a', '#f85149'],
    completed:             ['#1a3a1a', '#39d353'],
    completed_with_issues: ['#2a2a00', '#e3b341'],
    failed:                ['#3a0000', '#ff7b72'],
  };
  const [bg, fg] = colors[status] ?? ['#1a1a2a', '#e6edf3'];
  return `<span style="background:${bg};color:${fg};padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.5px">${esc(status)}</span>`;
}

function progressBar(value: number, total: number, color = '#238636'): string {
  if (total <= 0) return '<span style="color:#666">—</span>';
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    `<div style="background:#21262d;border-radius:4px;height:6px;width:120px;display:inline-block;vertical-align:middle">` +
    `<div style="background:${color};height:6px;border-radius:4px;width:${pct}%"></div></div> ` +
    `<span style="font-size:11px;color:#8b949e">${value}/${total} (${pct}%)</span>`
  );
}

function renderCampaignList(campaigns: Campaign[], token: string): string {
  const rows = campaigns.length === 0
    ? '<tr><td colspan="8" style="text-align:center;color:#8b949e;padding:32px">No campaigns yet. Create your first one below.</td></tr>'
    : campaigns.map(c => {
        const pct = c.target_count > 0 ? Math.round((c.delivered_count / c.target_count) * 100) : 0;
        const created = new Date(c.created_at).toISOString().slice(0, 10);
        return (
          '<tr>' +
          `<td><a href="/api/admin/campaigns/${esc(c.id)}?token=${esc(token)}" style="color:#58a6ff;text-decoration:none;font-weight:600">${esc(c.name)}</a>` +
          `<div style="font-size:11px;color:#8b949e">created ${created}</div></td>` +
          `<td>${statusBadge(c.status)}</td>` +
          `<td>${progressBar(c.delivered_count, c.target_count)}</td>` +
          `<td style="font-size:12px;color:#8b949e">${esc(pct)}%</td>` +
          `<td>${c.accepted_count}</td>` +
          `<td>${c.failed_count}</td>` +
          `<td style="font-size:11px">${esc((c.locations as string[]).slice(0, 3).join(', '))}${(c.locations as string[]).length > 3 ? ' +' + ((c.locations as string[]).length - 3) + ' more' : ''}</td>` +
          `<td>${actionButtons(c, token)}</td>` +
          '</tr>'
        );
      }).join('');

  return rows;
}

function actionButtons(c: Campaign, token: string): string {
  const base = `/api/campaigns/${esc(c.id)}`;
  const q = `token=${esc(token)}`;
  const btn = (action: string, label: string, color: string, confirm?: string) =>
    `<button onclick="${confirm ? `if(!confirm('${confirm}'))return;` : ''}postAction('${base}/${action}?${q}')" ` +
    `style="background:${color};color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;margin:1px">${label}</button>`;

  if (c.status === 'draft') {
    return btn('start', 'Start', '#238636') + btn('cancel', 'Cancel', '#58151c', 'Cancel this campaign?');
  }
  if (c.status === 'queued' || c.status === 'running') {
    return btn('pause', 'Pause', '#9e6a03') + btn('cancel', 'Cancel', '#58151c', 'Cancel this campaign?');
  }
  if (c.status === 'paused') {
    return btn('resume', 'Resume', '#1f6feb') + btn('cancel', 'Cancel', '#58151c', 'Cancel this campaign?');
  }
  return '';
}

function renderCreateForm(clients: { id: string; name: string }[], token: string): string {
  const clientOptions = clients.map(c =>
    `<option value="${esc(c.id)}"${c.id === DEFAULT_CLIENT_ID ? ' selected' : ''}>${esc(c.name)}</option>`
  ).join('');

  return `
<section id="create-form" style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:24px;margin-top:32px">
  <h2 style="margin:0 0 20px;font-size:16px;color:#e6edf3">New Campaign</h2>
  <form id="campaignForm" onsubmit="submitCreate(event)">
    <input type="hidden" name="token" value="${esc(token)}">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Campaign Name *</label>
        <input name="name" required placeholder="e.g. Marketing — USA Q3 2026"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Client *</label>
        <select name="client_id" required style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
          ${clientOptions}
        </select>
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Target Prospect Count *</label>
        <input name="target_count" type="number" min="1" max="5000" value="100" required
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Industry / Niche</label>
        <input name="industry" placeholder="e.g. SaaS, Marketing, FinTech"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
    </div>

    <div style="margin-top:16px">
      <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Locations * <span style="color:#666">(one per line or comma-separated)</span></label>
      <textarea name="locations" rows="3" placeholder="USA&#10;Canada&#10;France&#10;Germany&#10;United Kingdom"
        style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box;resize:vertical"></textarea>
    </div>

    <div style="margin-top:16px">
      <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Job Titles <span style="color:#666">(one per line)</span></label>
      <textarea name="job_titles" rows="3" placeholder="CMO&#10;Head of Marketing&#10;VP Marketing&#10;Marketing Director"
        style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box;resize:vertical"></textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Seniority Levels <span style="color:#666">(comma-separated)</span></label>
        <input name="seniority" placeholder="VP, C-Suite, Director, Manager"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Company Size</label>
        <input name="company_size" placeholder="e.g. 10-50, 50-200, 200+"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Keywords <span style="color:#666">(comma-separated)</span></label>
        <input name="keywords" placeholder="e.g. demand generation, growth, revenue"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Exclusion Keywords</label>
        <input name="exclusion_keywords" placeholder="e.g. intern, freelance, student"
          style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box">
      </div>
    </div>

    <div style="margin-top:16px">
      <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Additional Criteria / Notes</label>
      <textarea name="criteria" rows="2" placeholder="One criterion per line. E.g. Must have raised funding, Must be hiring"
        style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box;resize:vertical"></textarea>
    </div>

    <div style="margin-top:16px">
      <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Research Requirements</label>
      <textarea name="research_requirements" rows="2" placeholder="What signals matter most for this ICP?"
        style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;box-sizing:border-box;resize:vertical"></textarea>
    </div>

    <div style="margin-top:20px;display:flex;gap:10px">
      <button type="submit" name="action" value="draft"
        style="background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:6px;padding:8px 20px;cursor:pointer;font-size:13px">
        Save Draft
      </button>
      <button type="submit" name="action" value="start"
        style="background:#238636;border:1px solid #2ea043;color:#fff;border-radius:6px;padding:8px 20px;cursor:pointer;font-size:13px;font-weight:600">
        Save &amp; Start Campaign
      </button>
    </div>
  </form>
</section>`;
}

function renderCampaignDetail(c: Campaign, events: CampaignEvent[], token: string): string {
  const icp = c.icp_config as Record<string, unknown>;
  const locations = (c.locations as string[]).join(', ');
  const criteria = (c.criteria as string[]).join(', ');

  const eventsHtml = events.length === 0
    ? '<p style="color:#8b949e;font-size:12px">No events yet.</p>'
    : events.map(e => {
        const ts = new Date(e.created_at).toISOString().replace('T', ' ').slice(0, 19);
        return (
          `<div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid #21262d;font-size:12px">` +
          `<span style="color:#8b949e;white-space:nowrap">${esc(ts)}</span>` +
          `<span style="color:#e6edf3">${esc(e.event_type)}</span>` +
          (e.from_status ? `<span style="color:#8b949e">${esc(e.from_status)} → ${esc(e.to_status ?? '')}</span>` : '') +
          (e.actor ? `<span style="color:#58a6ff">${esc(e.actor)}</span>` : '') +
          (e.reason ? `<span style="color:#8b949e;font-style:italic">${esc(e.reason)}</span>` : '') +
          '</div>'
        );
      }).join('');

  return `
<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:24px;margin-top:16px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="margin:0 0 4px;font-size:18px">${esc(c.name)}</h2>
      <div>${statusBadge(c.status)}</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${actionButtons(c, token)}</div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px">
    ${stat('Target', String(c.target_count))}
    ${stat('Delivered', String(c.delivered_count))}
    ${stat('Research Done', String(c.research_complete_count))}
    ${stat('Failed', String(c.failed_count))}
  </div>

  <div style="margin-top:20px">
    <div style="font-size:12px;color:#8b949e;margin-bottom:6px">Progress</div>
    ${progressBar(c.delivered_count, c.target_count, '#238636')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
    <div>
      <h3 style="font-size:13px;color:#8b949e;margin:0 0 8px">ICP Configuration</h3>
      <table style="font-size:12px;border-collapse:collapse;width:100%">
        ${icpRow('Industry', icp.industry)}
        ${icpRow('Job Titles', Array.isArray(icp.job_titles) ? (icp.job_titles as string[]).join(', ') : icp.job_titles)}
        ${icpRow('Seniority', Array.isArray(icp.seniority) ? (icp.seniority as string[]).join(', ') : icp.seniority)}
        ${icpRow('Company Size', icp.company_size)}
        ${icpRow('Keywords', Array.isArray(icp.keywords) ? (icp.keywords as string[]).join(', ') : icp.keywords)}
        ${icpRow('Exclusions', Array.isArray(icp.exclusion_keywords) ? (icp.exclusion_keywords as string[]).join(', ') : icp.exclusion_keywords)}
        ${icpRow('Locations', locations)}
        ${icpRow('Criteria', criteria)}
        ${icpRow('Research Notes', icp.research_requirements)}
      </table>
    </div>
    <div>
      <h3 style="font-size:13px;color:#8b949e;margin:0 0 8px">Pipeline Counters</h3>
      <table style="font-size:12px;border-collapse:collapse;width:100%">
        ${icpRow('Pending', String(c.pending_count))}
        ${icpRow('Accepted', String(c.accepted_count))}
        ${icpRow('Rejected', String(c.rejected_count))}
        ${icpRow('Research Complete', String(c.research_complete_count))}
        ${icpRow('Personalized', String(c.personalized_count))}
        ${icpRow('QA Passed', String(c.qa_passed_count))}
        ${icpRow('Delivered', String(c.delivered_count))}
        ${icpRow('Failed', String(c.failed_count))}
      </table>
    </div>
  </div>

  <div style="margin-top:24px">
    <h3 style="font-size:13px;color:#8b949e;margin:0 0 8px">Activity Log</h3>
    ${eventsHtml}
  </div>
</div>`;
}

function stat(label: string, value: string): string {
  return (
    `<div style="background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:12px">` +
    `<div style="font-size:11px;color:#8b949e">${esc(label)}</div>` +
    `<div style="font-size:22px;font-weight:700;color:#e6edf3;margin-top:2px">${esc(value)}</div>` +
    `</div>`
  );
}

function icpRow(label: string, value: unknown): string {
  if (!value && value !== 0) return '';
  const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (!v.trim()) return '';
  return `<tr><td style="padding:3px 8px 3px 0;color:#8b949e;white-space:nowrap">${esc(label)}</td><td style="padding:3px 0;color:#e6edf3">${esc(v)}</td></tr>`;
}

const JS = `
<script>
async function postAction(url) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const j = await r.json().catch(() => ({}));
  if (j.ok === false) { alert('Error: ' + (j.error || 'unknown')); return; }
  window.location.reload();
}

async function submitCreate(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const action = document.activeElement?.getAttribute?.('value') || 'draft';
  const token = fd.get('token');

  function splitLines(s) { return s ? s.split(/[\n,]+/).map(x => x.trim()).filter(Boolean) : []; }

  const body = {
    client_id: fd.get('client_id'),
    name: fd.get('name'),
    target_count: Number(fd.get('target_count')),
    locations: splitLines(fd.get('locations') || ''),
    criteria: splitLines(fd.get('criteria') || ''),
    icp_config: {
      industry: fd.get('industry') || undefined,
      job_titles: splitLines(fd.get('job_titles') || ''),
      seniority: splitLines(fd.get('seniority') || ''),
      company_size: fd.get('company_size') || undefined,
      keywords: splitLines(fd.get('keywords') || ''),
      exclusion_keywords: splitLines(fd.get('exclusion_keywords') || ''),
      research_requirements: fd.get('research_requirements') || undefined,
    },
  };

  const r = await fetch('/api/campaigns?token=' + token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (j.ok === false) { alert('Error: ' + (j.error || 'unknown')); return; }
  const id = j.data?.id;
  if (!id) { alert('Campaign created but no ID returned'); window.location.reload(); return; }

  if (action === 'start') {
    const sr = await fetch('/api/campaigns/' + id + '/start?token=' + token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    const sj = await sr.json().catch(() => ({}));
    if (sj.ok === false) {
      alert('Campaign saved but could not start: ' + (sj.error || 'unknown'));
    }
  }
  window.location.href = window.location.pathname + '/' + id + '?token=' + token;
}
</script>`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Preframe</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0b0f14;color:#e6edf3;margin:0;padding:0}
.wrap{max-width:1200px;margin:0 auto;padding:24px}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#8b949e;padding:8px 12px;border-bottom:1px solid #21262d}
td{padding:10px 12px;border-bottom:1px solid #21262d;vertical-align:middle;font-size:13px}
tr:hover td{background:#161b22}
a{color:#58a6ff}
input,select,textarea{color-scheme:dark}
</style>
</head>
<body>
<div class="wrap">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
  <div>
    <a href="/api/admin/dashboard" style="font-size:12px;color:#8b949e;text-decoration:none">← Dashboard</a>
    <h1 style="margin:4px 0 0;font-size:22px">${esc(title)}</h1>
  </div>
</div>
${body}
</div>
${JS}
</body>
</html>`;
}

export function registerCampaignBuilderRoutes(app: Express): void {
  // Campaign list + create form
  app.get('/api/admin/campaigns', (req: Request, res: Response) => {
    if (!checkToken(req, res)) return;
    const token = String(req.query.token ?? '');

    void (async () => {
      const [campaigns, clients] = await Promise.all([
        listCampaigns(),
        query<{ id: string; name: string }>(`SELECT id, name FROM clients ORDER BY name`),
      ]);
      const tableRows = renderCampaignList(campaigns, token);
      const html = page('ICP Campaign Builder', `
<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden">
  <table>
    <thead><tr>
      <th>Campaign</th><th>Status</th><th>Progress</th><th>%</th>
      <th>Accepted</th><th>Failed</th><th>Locations</th><th>Actions</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>
${renderCreateForm(clients, token)}`);
      res.send(html);
    })().catch(err => res.status(500).send(notice('Error', esc((err as Error).message))));
  });

  // Campaign detail page
  app.get('/api/admin/campaigns/:id', (req: Request, res: Response) => {
    if (!checkToken(req, res)) return;
    const token = String(req.query.token ?? '');

    void (async () => {
      const [campaign, events] = await Promise.all([
        getCampaign(String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)),
        getCampaignEvents(String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id), 100),
      ]);
      if (!campaign) {
        res.status(404).send(notice('Not Found', 'Campaign not found.'));
        return;
      }
      const html = page(campaign.name, renderCampaignDetail(campaign, events, token));
      res.send(html);
    })().catch(err => res.status(500).send(notice('Error', esc((err as Error).message))));
  });
}

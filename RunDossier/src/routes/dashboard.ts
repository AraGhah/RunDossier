import { type Express, type Request, type Response } from 'express';
import { getDashboardRows, healthScore, type DashboardRow } from '../services/dashboard.service.js';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[c] ?? c
  );
}

function money(n: number | null): string {
  return n == null ? '<span class="muted">-</span>' : '$' + Number(n).toLocaleString();
}

function pct(n: number | null): string {
  return n == null ? '<span class="muted">-</span>' : esc(n) + '%';
}

function nextDelivery(row: DashboardRow): string {
  if (row.next_delivery_date) return esc(row.next_delivery_date);
  if (row.in_pipeline > 0) return '<span class="muted">in progress</span>';
  return '<span class="muted">-</span>';
}

function healthCell(score: number): string {
  const color = score >= 70 ? '#1f7a3d' : score >= 40 ? '#8a6d1a' : '#8a2a22';
  const fg = score >= 70 ? '#7ee787' : score >= 40 ? '#f0c64b' : '#ff7b72';
  return `<span style="background:${color};color:${fg};padding:2px 9px;border-radius:999px;font-weight:600">${score}</span>`;
}

function notice(title: string, body: string): string {
  return (
    '<!doctype html><meta charset="utf-8"><title>' + title + '</title>' +
    '<body style="font-family:system-ui,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">' +
    '<div style="max-width:460px;text-align:center;padding:24px"><h1 style="font-size:20px">' + title + '</h1>' +
    '<p style="color:#9bb0c3;line-height:1.6">' + body + '</p></div></body>'
  );
}

function render(rows: DashboardRow[]): string {
  const totalMrr = rows.reduce((a, r) => a + (Number(r.mrr) || 0), 0);
  const scored = rows.map((r) => ({ r, h: healthScore(r) }));
  const atRisk = scored.filter((x) => x.h < 40).length;
  const body = scored
    .map(({ r, h }) => {
      const last = r.last_delivered_at ? new Date(r.last_delivered_at).toISOString().slice(0, 10) : '-';
      return (
        '<tr>' +
        `<td><strong>${esc(r.name)}</strong><div class="muted" style="font-size:11px">last delivery ${last}</div></td>` +
        `<td>${r.tier ? esc(r.tier) : '<span class="muted">-</span>'}</td>` +
        `<td>${money(r.mrr)}</td>` +
        `<td>${healthCell(h)}</td>` +
        `<td>${pct(r.reply_rate)}</td>` +
        `<td>${r.delivered_this_month}</td>` +
        `<td>${nextDelivery(r)}</td>` +
        `<td>${r.in_pipeline || '<span class="muted">0</span>'}</td>` +
        `<td><span class="status">${esc(r.status)}</span></td>` +
        '</tr>'
      );
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>Client ops dashboard</title>
<style>
  body{margin:0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:#0b0f14;color:#e6edf3;padding:28px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:#9bb0c3;font-size:13px;margin:0 0 18px}
  .cards{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
  .kpi{background:#11161d;border:1px solid #222c38;border-radius:12px;padding:12px 16px;min-width:120px}
  .kpi .n{font-size:22px;font-weight:700}.kpi .l{color:#9bb0c3;font-size:12px}
  table{width:100%;border-collapse:collapse;background:#11161d;border:1px solid #222c38;border-radius:12px;overflow:hidden}
  th,td{padding:11px 14px;text-align:left;font-size:13px;border-bottom:1px solid #1c2530}
  th{color:#9bb0c3;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  tr:last-child td{border-bottom:0}.muted{color:#6b7c8d}
  .status{background:#0d1219;border:1px solid #2a3848;border-radius:6px;padding:1px 8px;font-size:12px}
</style></head>
<body>
  <h1>Client ops dashboard</h1>
  <p class="sub">Live from Supabase. ${rows.length} client(s).</p>
  <div class="cards">
    <div class="kpi"><div class="n">${rows.length}</div><div class="l">Clients</div></div>
    <div class="kpi"><div class="n">$${totalMrr.toLocaleString()}</div><div class="l">Total MRR</div></div>
    <div class="kpi"><div class="n">${atRisk}</div><div class="l">At risk (health &lt; 40)</div></div>
  </div>
  <table>
    <thead><tr>
      <th>Client</th><th>Tier</th><th>MRR</th><th>Health</th><th>Reply 30d</th>
      <th>Delivered (mo)</th><th>Next delivery</th><th>In pipeline</th><th>Status</th>
    </tr></thead>
    <tbody>${body || '<tr><td colspan="9" class="muted">No clients yet.</td></tr>'}</tbody>
  </table>
</body></html>`;
}

/** GET /api/admin/dashboard?token=... -> internal ops dashboard (all clients). */
export async function handleDashboard(req: Request, res: Response): Promise<void> {
  const required = (process.env.DASHBOARD_TOKEN ?? '').trim();
  if (!required) {
    res.status(403).send(notice('Dashboard disabled', 'Set DASHBOARD_TOKEN in your .env to enable the ops dashboard.'));
    return;
  }
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (token !== required) {
    res.status(401).send(notice('Unauthorized', 'Append ?token=YOUR_DASHBOARD_TOKEN to the URL.'));
    return;
  }
  const rows = await getDashboardRows();
  res.status(200).type('html').send(render(rows));
}

export function registerDashboardRoutes(app: Express): void {
  app.get('/api/admin/dashboard', (req, res) => {
    void handleDashboard(req, res);
  });
}

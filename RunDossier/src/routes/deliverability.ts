/**
 * GET /api/admin/deliverability — internal sender-readiness dashboard (Part 3).
 * Token-gated like the ops dashboard (DASHBOARD_TOKEN). Read-only; never sends.
 */
import { type Express, type Request, type Response } from 'express';
import { listSenderDomains, recentEvents } from '../services/deliverability/sender-domains.repo.js';
import { computeReadiness, effectiveState, mailboxAgeDays } from '../services/deliverability/readiness.js';
import { loadThresholds, type SenderDomain, type ReadinessState } from '../services/deliverability/types.js';

const PRIMARY_WARNING =
  'Primary operating domain detected. Do not use this domain for scaled cold outreach. ' +
  'Authenticate it for normal business email, then use a separate dedicated sending domain for outbound volume.';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[c] ?? c,
  );
}

function notice(title: string, body: string): string {
  return (
    '<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title>' +
    '<body style="font-family:system-ui,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">' +
    '<div style="max-width:520px;text-align:center;padding:24px"><h1 style="font-size:20px">' + esc(title) + '</h1>' +
    '<p style="color:#9bb0c3;line-height:1.6">' + esc(body) + '</p></div></body>'
  );
}

const READINESS_COLOR: Record<ReadinessState, [string, string]> = {
  blocked: ['#3a1216', '#ff7b72'],
  paused: ['#3a1216', '#ff7b72'],
  auth_incomplete: ['#3a2e10', '#f0c64b'],
  not_ready: ['#3a2e10', '#f0c64b'],
  warming: ['#10243a', '#79c0ff'],
  limited_test_ready: ['#0f2a1a', '#7ee787'],
  scaled_sending_ready: ['#0f3a22', '#56d364'],
};

function pill(state: ReadinessState): string {
  const [bg, fg] = READINESS_COLOR[state] ?? ['#1c2530', '#9bb0c3'];
  return `<span style="background:${bg};color:${fg};padding:2px 9px;border-radius:999px;font-weight:600;font-size:12px">${esc(state)}</span>`;
}

function authCell(v: string): string {
  const ok = v === 'pass';
  const color = ok ? '#7ee787' : v === 'missing' || v === 'fail' ? '#ff7b72' : '#9bb0c3';
  return `<span style="color:${color}">${esc(v)}</span>`;
}

function row(s: SenderDomain): string {
  const t = loadThresholds();
  const state = effectiveState(s, t);
  const auto = computeReadiness(s, t);
  const ageDays = mailboxAgeDays(s);
  const role = s.is_primary_domain ? 'PRIMARY (ops)' : s.is_cold_sending_domain ? 'cold-send' : 'other';
  const reasons = state === auto.state ? auto.reasons.join('; ') : auto.reasons.join('; ');
  return (
    '<tr>' +
    `<td><strong>${esc(s.domain)}</strong><div class="muted" style="font-size:11px">${esc(role)}${s.primary_override ? ' · override ON' : ''}</div></td>` +
    `<td>${esc(s.provider ?? '-')}</td>` +
    `<td>${authCell(s.spf_status)}</td>` +
    `<td>${authCell(s.dkim_status)}</td>` +
    `<td>${authCell(s.dmarc_status)}</td>` +
    `<td>${pill(state)}<div class="muted" style="font-size:11px;max-width:240px">${esc(reasons)}</div></td>` +
    `<td>${ageDays == null ? '<span class="muted">-</span>' : Math.floor(ageDays) + 'd'}</td>` +
    `<td>${esc(s.warmup_status)}</td>` +
    `<td>${s.current_daily_send_count}/${s.daily_send_limit}</td>` +
    `<td>${s.bounce_rate ?? '-'}% / ${s.spam_rate ?? '-'}%</td>` +
    `<td>${s.is_sending_paused ? `<span style="color:#ff7b72">paused</span><div class="muted" style="font-size:11px">${esc(s.pause_reason ?? '')}</div>` : 'no'}</td>` +
    '</tr>'
  );
}

function render(senders: SenderDomain[], events: Record<string, unknown>[]): string {
  const hasPrimary = senders.some((s) => s.is_primary_domain && !s.is_cold_sending_domain);
  const banner = hasPrimary
    ? `<div style="background:#3a1216;border:1px solid #5a2a2a;color:#ffb3ad;padding:12px 16px;border-radius:10px;margin-bottom:18px;font-weight:600">⚠ ${esc(PRIMARY_WARNING)}</div>`
    : '';
  const body = senders.map(row).join('') || '<tr><td colspan="11" class="muted">No sender domains configured.</td></tr>';
  const ev = events
    .map(
      (e) =>
        `<tr><td>${esc(e.domain)}</td><td>${esc(e.from_state)} → ${esc(e.to_state)}</td><td>${esc(e.reason)}</td><td>${esc(e.actor)}</td><td class="muted">${esc(String(e.created_at).slice(0, 19))}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>Deliverability readiness</title>
<style>
  body{margin:0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:#0b0f14;color:#e6edf3;padding:28px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:#9bb0c3;font-size:13px;margin:0 0 18px}
  table{width:100%;border-collapse:collapse;background:#11161d;border:1px solid #222c38;border-radius:12px;overflow:hidden;margin-bottom:24px}
  th,td{padding:10px 13px;text-align:left;font-size:13px;border-bottom:1px solid #1c2530;vertical-align:top}
  th{color:#9bb0c3;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  tr:last-child td{border-bottom:0}.muted{color:#6b7c8d}
  h2{font-size:14px;color:#9bb0c3;margin:0 0 8px}
</style></head>
<body>
  <h1>Deliverability readiness</h1>
  <p class="sub">Sender domains, authentication, and send-gate state. Read-only — this view never sends.</p>
  ${banner}
  <table>
    <thead><tr>
      <th>Domain</th><th>Provider</th><th>SPF</th><th>DKIM</th><th>DMARC</th><th>Readiness</th>
      <th>Mailbox age</th><th>Warm-up</th><th>Daily</th><th>Bounce / Spam</th><th>Paused</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>
  <h2>Recent state changes</h2>
  <table>
    <thead><tr><th>Domain</th><th>Transition</th><th>Reason</th><th>Actor</th><th>When (UTC)</th></tr></thead>
    <tbody>${ev || '<tr><td colspan="5" class="muted">No events yet.</td></tr>'}</tbody>
  </table>
</body></html>`;
}

export async function handleDeliverability(req: Request, res: Response): Promise<void> {
  const required = (process.env.DASHBOARD_TOKEN ?? '').trim();
  if (!required) {
    res.status(403).send(notice('Dashboard disabled', 'Set DASHBOARD_TOKEN in your .env to enable the deliverability dashboard.'));
    return;
  }
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (token !== required) {
    res.status(401).send(notice('Unauthorized', 'Append ?token=YOUR_DASHBOARD_TOKEN to the URL.'));
    return;
  }
  try {
    const [senders, events] = await Promise.all([listSenderDomains(), recentEvents(25)]);
    if (req.path.endsWith('.json')) {
      res.status(200).json({
        warning: senders.some((s) => s.is_primary_domain && !s.is_cold_sending_domain) ? PRIMARY_WARNING : null,
        senders: senders.map((s) => ({ ...s, computed_readiness: effectiveState(s, loadThresholds()) })),
        events,
      });
      return;
    }
    res.status(200).type('html').send(render(senders, events));
  } catch (err) {
    res.status(500).send(notice('Deliverability unavailable', `Could not load sender domains: ${(err as Error).message}. Run "npm run deliverability:migrate".`));
  }
}

export function registerDeliverabilityRoutes(app: Express): void {
  app.get('/api/admin/deliverability', (req, res) => { void handleDeliverability(req, res); });
  app.get('/api/admin/deliverability.json', (req, res) => { void handleDeliverability(req, res); });
}

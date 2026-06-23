import { query } from '../db.js';
import { notify } from '../notify.js';
import {
  type ClientSpend,
  type GovernorReport,
  clientBreaches,
  globalBreach,
  formatGovernorAlert,
  hasAlert,
} from '../utils/cost-governor.js';

interface ClientCostRow {
  client_id: string;
  name: string | null;
  tier: string | null;
  cost: string;
}
interface TotalRow {
  total: string;
}

/**
 * Build yesterday's cost report from ai_costs (UTC day window). Pure DB read — does
 * not send anything; exported so the simulate script and tests can reuse it.
 */
export async function buildGovernorReport(): Promise<GovernorReport> {
  const rows = await query<ClientCostRow>(
    `SELECT c.id AS client_id, c.name, c.tier, COALESCE(SUM(ac.cost_usd), 0)::text AS cost
       FROM ai_costs ac
       JOIN prospects p ON p.id = ac.prospect_id
       JOIN clients   c ON c.id = p.client_id
      WHERE ac.created_at >= (now()::date - 1) AND ac.created_at < now()::date
      GROUP BY c.id, c.name, c.tier`
  );

  const [totalRow] = await query<TotalRow>(
    `SELECT COALESCE(SUM(cost_usd), 0)::text AS total
       FROM ai_costs
      WHERE created_at >= (now()::date - 1) AND created_at < now()::date`
  );

  const spend: ClientSpend[] = rows.map((r) => ({
    clientId: r.client_id,
    name: r.name,
    tier: r.tier,
    costUsd: Number(r.cost),
  }));
  const totalUsd = Number(totalRow?.total ?? 0);

  return {
    date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
    totalUsd,
    breaches: clientBreaches(spend),
    global: globalBreach(totalUsd),
  };
}

/**
 * Cost Governor v1 — daily 01:00. Sums yesterday's AI spend per client, compares to
 * tier soft-caps ($10 Starter / $20 Pro / $35 Scale) and the global $50 ceiling, and
 * fires a Telegram alert (free bot via notify()) when any cap is exceeded. Quiet when clean.
 */
export async function runCostGovernor(): Promise<void> {
  const report = await buildGovernorReport();
  const text = formatGovernorAlert(report);

  if (hasAlert(report) && text) {
    await notify(text);
    await query(
      `INSERT INTO events (event_type, entity_type, metadata)
       VALUES ('cost_governor_alert', 'cost', $1::jsonb)`,
      [
        JSON.stringify({
          date: report.date,
          totalUsd: report.totalUsd,
          global: report.global,
          breaches: report.breaches.length,
        }),
      ]
    ).catch((e) => console.error('[cost-governor] event log error:', (e as Error).message));
    console.warn(
      `[cost-governor] ALERT ${report.date}: global=${report.global} total=$${report.totalUsd.toFixed(2)} breaches=${report.breaches.length}`
    );
  } else {
    console.log(
      `[cost-governor] ${report.date}: clean — total $${report.totalUsd.toFixed(2)}, no tier/global breach`
    );
  }
}

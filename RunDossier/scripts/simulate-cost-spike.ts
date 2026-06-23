/**
 * Simulate a cost spike to verify Cost Governor v1 end-to-end.
 * Inserts a temporary ai_costs row dated "yesterday" that blows past both a client's
 * tier soft-cap and the global $50 ceiling, runs the governor (which sends a Telegram
 * alert via the existing bot), then deletes the temporary row.
 *
 * Requires DATABASE_URL + TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in your env.
 * Usage: npm run governor:simulate   (or: npx tsx scripts/simulate-cost-spike.ts)
 *
 * "Done when": you receive the Telegram message on your phone.
 */
import 'dotenv/config';
import { pool, query, queryOne } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { runCostGovernor } from '../src/jobs/cost-governor.job.js';

const SENTINEL = '__cost_spike_sim__';
const SPIKE_USD = 60; // > $50 global and > every tier soft-cap

async function main(): Promise<void> {
  validateConfig();

  // Attribute the spike to a real prospect that maps to a client, so the per-client
  // tier breach path also fires. Fall back to a client-less prospect (global only).
  const linked = await queryOne<{ id: string; client: string | null }>(
    `SELECT p.id, c.name AS client
       FROM prospects p JOIN clients c ON c.id = p.client_id
      ORDER BY p.created_at DESC LIMIT 1`
  );
  const anyProspect = linked ?? (await queryOne<{ id: string; client: string | null }>(
    `SELECT id, NULL::text AS client FROM prospects ORDER BY created_at DESC LIMIT 1`
  ));

  if (!anyProspect) {
    throw new Error('No prospects exist to attribute a simulated cost to. Ingest at least one prospect first.');
  }

  console.log(
    `[simulate] injecting $${SPIKE_USD} spike on prospect ${anyProspect.id}` +
      (anyProspect.client ? ` (client: ${anyProspect.client})` : ' (no client mapping — global-only test)')
  );

  try {
    // Dated yesterday-noon so it lands in the governor's [yesterday, today) window.
    await query(
      `INSERT INTO ai_costs (agent_name, prospect_id, model, input_tokens, output_tokens, cost_usd, created_at)
       VALUES ($1, $2, 'simulated', 0, 0, $3, (now()::date - 1) + interval '12 hours')`,
      [SENTINEL, anyProspect.id, SPIKE_USD]
    );

    console.log('[simulate] running cost governor (expect a Telegram alert)...');
    await runCostGovernor();
    console.log('[simulate] governor ran. Check your Telegram for the alert.');
  } finally {
    const removed = await query<{ id: string }>(
      `DELETE FROM ai_costs WHERE agent_name = $1 RETURNING id`,
      [SENTINEL]
    );
    console.log(`[simulate] cleanup: removed ${removed.length} simulated ai_costs row(s).`);
    await pool.end();
  }
}

void main().catch(async (err) => {
  console.error('[simulate] failed:', err);
  try {
    await query(`DELETE FROM ai_costs WHERE agent_name = $1`, [SENTINEL]);
  } catch {
    /* best-effort cleanup */
  }
  await pool.end().catch(() => {});
  process.exit(1);
});

/**
 * Apply the warm-pilot + batch-cost + cost-governor migrations (021-024) to Supabase, in order.
 * These are idempotent and were already applied to production on 2026-06-22; this script
 * exists so a fresh database reaches the same state.
 * Usage: npx tsx scripts/apply-warmpilot-cost-migrations.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  '021_pilot_requests_outbound_tracking.sql',
  '022_pilot_requests_upsert_rpc.sql',
  '023_batch_cost_rollup.sql',
  '024_ai_costs_indexes.sql',
];

async function main(): Promise<void> {
  validateConfig();
  for (const file of MIGRATIONS) {
    const sql = readFileSync(join(__dirname, '../sql/migrations', file), 'utf8');
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

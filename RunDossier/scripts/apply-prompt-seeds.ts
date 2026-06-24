/**
 * Apply the agent prompt seeds (research v2, QA v4, personalization v4) to Supabase, in order.
 * Idempotent: each seed guards against duplicate versions and re-activates the right one.
 * Already applied to production on 2026-06-23; this exists so a fresh DB reaches the same state.
 * Usage: npm run prompts:seed
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// NOTE: research_prompt_v2.sql is intentionally EXCLUDED. Its conservative confidence
// guidance ("below 60 means thin, do not pad") scored good prospects below the 60 floor
// and flooded thin_research (2026-06-23 yield regression). Research stays at v1 until a
// calibrated v3 is written and tested. Do not re-add v2.
const SEEDS = [
  'qa_prompt_v4.sql',
  'personalization_prompt_v4.sql',
];

async function main(): Promise<void> {
  validateConfig();
  for (const file of SEEDS) {
    const sql = readFileSync(join(__dirname, '../sql/seeds', file), 'utf8');
    await pool.query(sql);
    console.log(`Seeded ${file}`);
  }
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

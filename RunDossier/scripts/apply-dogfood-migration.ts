/**
 * Apply dogfood migration to Supabase.
 * Usage: npx tsx scripts/apply-dogfood-migration.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  validateConfig();
  const sql = readFileSync(
    join(__dirname, '../sql/migrations/002_dogfood_pipeline.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migration 002_dogfood_pipeline applied.');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

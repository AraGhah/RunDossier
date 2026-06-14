import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

function requireDatabaseUrl(): void {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.startsWith('<')) {
    throw new Error('Missing DATABASE_URL in environment (.env)');
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function applySql(relativePath: string): Promise<void> {
  const sql = readFileSync(join(root, relativePath), 'utf8');
  await pool.query(sql);
  console.log(`Applied ${relativePath}`);
}

async function main(): Promise<void> {
  requireDatabaseUrl();
  await applySql('sql/migrations/004_workflow_w2_w5.sql');
  await applySql('sql/migrations/005_workflow_fixes.sql');
  await applySql('sql/migrations/006_failed_jobs_backfill.sql');
  await applySql('sql/migrations/007_prospect_search.sql');
  await applySql('sql/migrations/008_apollo_research.sql');
  await applySql('sql/seeds/workflow-prompts.sql');
  console.log('Workflow W2–W5 migrations complete.');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

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

const STATUS_CONSTRAINT_BLOCK =
  /ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;\s*ALTER TABLE prospects ADD CONSTRAINT prospects_status_check CHECK \(status IN \([^;]+\)\);/gis;

const MIGRATION_FILES = [
  'sql/migrations/004_workflow_w2_w5.sql',
  'sql/migrations/005_workflow_fixes.sql',
  'sql/migrations/006_failed_jobs_backfill.sql',
  'sql/migrations/007_prospect_search.sql',
  'sql/migrations/008_apollo_research.sql',
  'sql/migrations/009_prospects_updated_at.sql',
  'sql/migrations/010_audit_events.sql',
  'sql/migrations/011_delivery_email_tracking.sql',
  'sql/migrations/012_delivery_events.sql',
  'sql/migrations/013_telegram_bot.sql',
  'sql/migrations/014_workflow_runs.sql',
  'sql/migrations/015_telegram_log_duplicate.sql',
  'sql/migrations/016_client_onboarding.sql',
  'sql/migrations/017_onboarding_form_fields.sql',
  'sql/migrations/018_client_metrics.sql',
  'sql/migrations/019_dead_letter_status.sql',
  'sql/migrations/020_failed_jobs_dead_letter_at.sql',
  'sql/seeds/workflow-prompts.sql',
] as const;

async function currentProspectStatusConstraint(): Promise<string | null> {
  const res = await pool.query<{ def: string }>(
    `SELECT pg_get_constraintdef(c.oid) AS def
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     WHERE t.relname = 'prospects' AND c.conname = 'prospects_status_check'`
  );
  return res.rows[0]?.def ?? null;
}

function constraintIsCurrent(def: string | null): boolean {
  if (!def) return false;
  return def.includes('dead_letter') && def.includes('delivering');
}

async function applySql(relativePath: string, skipStatusConstraint: boolean): Promise<void> {
  let sql = readFileSync(join(root, relativePath), 'utf8');
  if (skipStatusConstraint) {
    const stripped = sql.replace(
      STATUS_CONSTRAINT_BLOCK,
      '-- [workflow:migrate] skipped prospects_status_check (already at current revision)'
    );
    if (stripped !== sql) {
      console.log(`  (status constraint skipped in ${relativePath})`);
      sql = stripped;
    }
  }
  await pool.query(sql);
  console.log(`Applied ${relativePath}`);
}

async function main(): Promise<void> {
  requireDatabaseUrl();
  const skipStatus = constraintIsCurrent(await currentProspectStatusConstraint());
  if (skipStatus) {
    console.log('Prospects status constraint already current — skipping downgrades in 004/005/011/019.');
  }

  for (const file of MIGRATION_FILES) {
    await applySql(file, skipStatus);
  }
  console.log('Workflow migrations complete.');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

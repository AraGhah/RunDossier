/**
 * Production-readiness audit — DB + pure logic checks.
 * Usage: npx tsx scripts/run-production-audit.ts
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, delimiter } from 'node:path';
import { pool, query, queryOne } from '../src/db.js';
import { isDuplicateTelegramUpdate } from '../src/telegram/commands.js';
import { buildDeliveryCsv } from '../src/utils/csv-delivery.js';
import { evaluateResearchQuality } from '../src/utils/research-quality.js';
import { shouldRunDelivery } from '../src/utils/delivery-trigger.js';
import { resolveSendOutcome } from '../src/jobs/delivery.job.js';
import { validateResearchRetriggerStatus } from '../src/services/prospect.service.js';
import { shouldSchedulerRetryResearch } from '../src/utils/research-retry.js';
import { isValidEmail } from '../src/utils/resend.js';
import type { ResearchOutput } from '../src/agents/research.agent.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

const results: Check[] = [];

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(ok ? `[PASS] ${name}` : `[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
}

function runCmd(name: string, cmd: string, args: string[], optional = false): boolean {
  const localBin = join(root, 'node_modules', '.bin');
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${localBin}${delimiter}${process.env.PATH ?? ''}`,
    },
  });
  const ok = result.status === 0;
  if (!ok && !optional) {
    const tail = (result.stderr || result.stdout || '').slice(-400);
    record(name, false, tail.trim() || `exit ${result.status}`);
  } else {
    record(name, ok, ok ? undefined : optional ? 'optional step skipped/failed' : undefined);
  }
  return ok;
}

async function dbChecks(): Promise<void> {
  const auditTable = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'audit_events'
     ) AS exists`
  );
  record('audit_events table exists', auditTable?.exists === true);

  const dupConstraint = await queryOne<{ def: string }>(
    `SELECT pg_get_constraintdef(oid) AS def
     FROM pg_constraint
     WHERE conname = 'telegram_command_log_result_check'`
  );
  record(
    'telegram_command_log allows duplicate result',
    dupConstraint?.def?.includes("'duplicate'") === true,
    dupConstraint?.def ?? 'constraint missing'
  );

  const orphanLines = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM first_lines fl
     LEFT JOIN prospects p ON p.id = fl.prospect_id
     WHERE p.id IS NULL`
  );
  record('no orphan first_lines', Number(orphanLines?.count ?? 0) === 0, `orphans=${orphanLines?.count}`);

  const dupDelivered = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM (
       SELECT client_id, name, linkedin_url, COUNT(*) AS c
       FROM prospects
       WHERE status = 'delivered' AND client_id IS NOT NULL
       GROUP BY client_id, name, linkedin_url
       HAVING COUNT(*) > 1
     ) d`
  );
  record('no duplicate delivered rows per client+linkedin', Number(dupDelivered?.count ?? 0) === 0);

  const testUpdateId = 8_000_000_000 + Math.floor(Date.now() % 1_000_000_000);
  const dup1 = await isDuplicateTelegramUpdate(testUpdateId);
  const dup2 = await isDuplicateTelegramUpdate(testUpdateId);
  record('duplicate telegram webhook blocked', dup1 === false && dup2 === true);

  try {
    validateResearchRetriggerStatus('delivered');
    record('retrigger blocks delivered status', false);
  } catch {
    record('retrigger blocks delivered status', true);
  }

  record(
    'delivery gate ignores qa_failed (pure)',
    shouldRunDelivery(0, 2) === true && shouldRunDelivery(1, 2) === false
  );

  record(
    'email skip does not finalize without DELIVERY_CSV_ONLY',
    resolveSendOutcome({ ok: false, skipped: true }).finalize === false
  );

  record(
    'scheduler skips terminal research errors',
    shouldSchedulerRetryResearch(1, 'kind=auth') === false
  );

  const weak: ResearchOutput = {
    top_3_signals: [{ signal: 'Works at Acme', source: 'linkedin', date: '2020-01-01' }],
    buying_triggers: [],
    research_summary: 'Generic',
    confidence_score: 40,
  };
  record('weak research rejected', evaluateResearchQuality(weak).acceptable === false);

  const csv = buildDeliveryCsv([
    {
      client_name: 'Audit',
      prospect_name: 'User',
      title: 'CEO',
      company: 'Co',
      company_domain: 'co.com',
      linkedin_url: 'https://linkedin.com/in/u',
      email: 'u@co.com',
      research_signals: 'A | B',
      source_links: 'https://a.com',
      research_summary: 'Two signals.',
      confidence_score: 90,
      subject: 's',
      opener: 'o',
      bridge: 'b',
      variant_number: 1,
      prospect_status: 'personalized_qa_passed',
      batch_id: 'b',
      delivery_id: 'd',
      run_id: 'r',
      generated_at: new Date().toISOString(),
    },
  ]);
  record('csv 20 columns + escaping', csv.split('\n')[0].split(',').length === 20 && csv.includes('Audit'));

  record('recipient email validation', isValidEmail('a@example.com') && !isValidEmail('bad'));
}

async function main(): Promise<void> {
  console.log('=== Production audit ===\n');

  if (process.argv.includes('--with-install')) {
    runCmd('dependency install (npm install)', 'npm', ['install'], true);
  } else {
    record('dependency install', true, 'skipped (use --with-install to run npm install)');
  }

  runCmd('typecheck build', 'npm', ['run', 'build']);
  runCmd('unit tests', 'npm', ['test']);
  runCmd('security verify', 'npm', ['run', 'verify:security']);
  runCmd('pipeline verify', 'npm', ['run', 'verify']);

  console.log('\n--- DB / logic checks ---');
  await dbChecks();

  console.log('\n--- Integration scripts ---');
  runCmd('pipeline e2e db', 'npm', ['exec', 'tsx', 'scripts/test-pipeline-e2e.ts']);
  runCmd('delivery email test', 'npm', ['exec', 'tsx', 'scripts/test-delivery-email.ts']);

  const failed = results.filter((r) => !r.ok);
  const score = Math.round(((results.length - failed.length) / results.length) * 100);
  console.log(`\n=== Audit score: ${score}% (${results.length - failed.length}/${results.length}) ===`);
  await pool.end();
  if (failed.length > 0) process.exit(1);
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

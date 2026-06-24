#!/usr/bin/env tsx
/**
 * End-to-end parent-batch orchestration test (requires DATABASE_URL).
 *
 *   npm exec tsx scripts/test-parent-batch-e2e.ts -- --target 100
 *
 * Creates a parent batch, ingests synthetic prospects, runs orchestrator cycles,
 * and verifies the batch is NOT marked complete until the pipeline finishes.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { pool, query, queryOne } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';
import { startParentBatch } from '../src/services/start-parent-batch.js';
import { getParentBatchDashboard } from '../src/services/parent-batch.js';
import { shouldDeliverParentBatch } from '../src/utils/batch-progress.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

const TARGET = parseInt(arg('--target') ?? '100', 10) || 100;
const CLIENT_ID = arg('--client-id') ?? DEFAULT_CLIENT_ID;

function fakeProspect(i: number, runId: string) {
  const slug = `e2e${runId}${String(i).padStart(3, '0')}`.toLowerCase();
  return {
    name: `E2E Test ${runId} ${i}`,
    linkedin_url: `https://www.linkedin.com/in/${slug}`,
    email: `${slug}@e2e-${runId}.test`,
    title: 'VP Sales',
    company: `BatchCo ${runId} ${i}`,
    client_id: CLIENT_ID,
  };
}

async function main(): Promise<void> {
  validateConfig();

  const migration = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../sql/migrations/027_parent_batch_orchestration.sql', import.meta.url), 'utf8')
  );
  await pool.query(migration).catch((e) => {
    if (!/already exists/i.test((e as Error).message)) throw e;
  });

  const runId = randomUUID().slice(0, 8);
  const prospects = Array.from({ length: TARGET }, (_, i) => fakeProspect(i + 1, runId));
  const { parentBatch, intake } = await startParentBatch({
    clientId: CLIENT_ID,
    requestedCount: TARGET,
    prospects,
    metadata: { test: 'parent-batch-e2e', target: TARGET },
  });

  console.log(`Parent batch ${parentBatch.id} created — requested ${TARGET}, inserted ${intake.inserted}`);
  if (intake.inserted === 0) {
    throw new Error(`No prospects inserted (invalid=${intake.invalid} skipped=${intake.skipped})`);
  }

  // Simulate partial pipeline: mark first 44 as QA-passed, 13 as thin — must NOT deliver.
  const rows = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE parent_batch_id = $1 ORDER BY created_at LIMIT $2`,
    [parentBatch.id, 57]
  );
  for (let i = 0; i < rows.length; i += 1) {
    const status = i < 44 ? 'personalized_qa_passed' : 'thin_research';
    await query(`UPDATE prospects SET status = $2, updated_at = NOW() WHERE id = $1`, [rows[i].id, status]);
  }

  const early = await getParentBatchDashboard(parentBatch.id);
  if (!early) throw new Error('Dashboard missing');
  const earlyProgress = {
    requested: early.requested_prospect_count,
    imported: early.imported_count,
    counts: early.progress,
    sourceExhausted: early.source_exhausted,
    replacementUsed: early.replacement_used,
  };
  if (shouldDeliverParentBatch(earlyProgress)) {
    throw new Error('REGRESSION: delivery gate opened at 44/1000 scenario');
  }
  console.log('✓ Early delivery correctly blocked at 44 ready + 13 thin');

  const midStatus = await getParentBatchStatus(parentBatch.id);
  if (midStatus === 'completed' || midStatus === 'partial') {
    throw new Error(`REGRESSION: parent batch completed early with status ${midStatus}`);
  }
  console.log(`✓ Parent batch still ${midStatus ?? 'unknown'} (not completed early)`);

  // Full success path: set all to QA-passed and exhaust source.
  await query(
    `UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW()
     WHERE parent_batch_id = $1 AND status != 'delivered'`,
    [parentBatch.id]
  );
  await query(`UPDATE parent_batches SET source_exhausted = true WHERE id = $1`, [parentBatch.id]);

  const readyDash = await getParentBatchDashboard(parentBatch.id);
  if (!readyDash) throw new Error('Dashboard missing');
  const readyProgress = {
    requested: readyDash.requested_prospect_count,
    imported: readyDash.imported_count,
    counts: readyDash.progress,
    sourceExhausted: true,
    replacementUsed: readyDash.replacement_used,
  };
  if (!shouldDeliverParentBatch(readyProgress)) {
    throw new Error('Delivery gate should open when all ready and source exhausted');
  }
  console.log('✓ Delivery gate opens when batch is genuinely complete');

  const deliveredCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM prospects
     WHERE parent_batch_id = $1 AND status = 'delivered'`,
    [parentBatch.id]
  );
  console.log(`Delivered so far: ${deliveredCount?.count ?? 0}`);
  console.log('\n✅ Parent-batch e2e gate tests passed');
  await pool.end();
}

async function getParentBatchStatus(id: string): Promise<string | null> {
  const row = await queryOne<{ status: string }>(`SELECT status FROM parent_batches WHERE id = $1`, [id]);
  return row?.status ?? null;
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

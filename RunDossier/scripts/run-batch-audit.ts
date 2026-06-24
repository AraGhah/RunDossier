#!/usr/bin/env tsx
/**
 * Post-implementation batch audit — runs DB gate tests at 25/100/250 scale.
 * No live email or provider calls.
 *
 *   npm exec tsx scripts/run-batch-audit.ts
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool, query, queryOne } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { startParentBatch } from '../src/services/start-parent-batch.js';
import { getParentBatchDashboard } from '../src/services/parent-batch.js';
import { shouldDeliverParentBatch } from '../src/utils/batch-progress.js';
import { reconcileDeliveryCounts } from '../src/utils/batch-reconciliation.js';

const SIZES = [25, 100, 250] as const;
const AUDIT_CLIENT_NAME = 'Batch Audit Client';

function fakeProspect(i: number, runId: string, clientId: string) {
  const slug = `audit${runId}${String(i).padStart(4, '0')}`.toLowerCase();
  return {
    name: `Audit ${runId} ${i}`,
    linkedin_url: `https://www.linkedin.com/in/${slug}`,
    email: `${slug}@audit-${runId}.test`,
    title: 'VP Sales',
    company: `AuditCo ${runId} ${i}`,
    client_id: clientId,
  };
}

interface AuditResult {
  size: number;
  parentBatchId: string;
  inserted: number;
  earlyGateBlocked: boolean;
  finalGateOpen: boolean;
  reconcileOk: boolean;
  dbCounts: Record<string, number>;
}

async function applyMigrations(): Promise<void> {
  const root = process.cwd();
  for (const file of ['027_parent_batch_orchestration.sql', '028_parent_batch_hardening.sql']) {
    const sql = readFileSync(join(root, 'sql/migrations', file), 'utf8');
    await pool.query(sql).catch((e) => {
      if (!/already exists/i.test((e as Error).message)) throw e;
    });
  }
}

async function getAuditClientId(): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM clients WHERE name = $1 LIMIT 1`,
    [AUDIT_CLIENT_NAME]
  );
  if (existing) return existing.id;
  const created = await queryOne<{ id: string }>(
    `INSERT INTO clients (name, contact_email, client_first_name)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [AUDIT_CLIENT_NAME, 'audit-internal@test.local', 'Audit']
  );
  if (!created) throw new Error('Failed to create audit client');
  return created.id;
}

async function ensureAuditCanRun(clientId: string): Promise<void> {
  await query(
    `UPDATE parent_batches
        SET status = 'failed',
            error_message = 'Superseded by batch audit run',
            updated_at = NOW()
      WHERE client_id = $1
        AND metadata->>'audit' = 'true'
        AND status IN ('queued', 'processing', 'delivering')`,
    [clientId]
  );
  const active = await queryOne<{ id: string }>(
    `SELECT id FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
      LIMIT 1`,
    [clientId]
  );
  if (active) {
    await query(
      `UPDATE parent_batches SET status = 'failed', error_message = 'audit superseded', updated_at = NOW() WHERE id = $1`,
      [active.id]
    );
  }
}

async function auditSize(size: number, clientId: string): Promise<AuditResult> {
  const runId = randomUUID().slice(0, 8);
  const prospects = Array.from({ length: size }, (_, i) => fakeProspect(i + 1, runId, clientId));
  const { parentBatch, intake } = await startParentBatch({
    clientId,
    requestedCount: size,
    prospects,
    metadata: { audit: true, runId, size },
  });

  if (intake.inserted === 0) {
    throw new Error(`Audit ${size}: 0 inserted (skipped=${intake.skipped})`);
  }

  const rows = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE parent_batch_id = $1 ORDER BY created_at`,
    [parentBatch.id]
  );
  const earlyReady = size >= 57 ? 44 : Math.floor(size * 0.4);
  const earlyThin = size >= 57 ? 13 : Math.floor(size * 0.2);
  for (let i = 0; i < rows.length; i += 1) {
    let status = 'queued';
    if (i < earlyReady) status = 'personalized_qa_passed';
    else if (i < earlyReady + earlyThin) status = 'thin_research';
    await query(`UPDATE prospects SET status = $2, updated_at = NOW() WHERE id = $1`, [rows[i].id, status]);
  }

  const earlyDash = await getParentBatchDashboard(parentBatch.id);
  const earlyGateBlocked = earlyDash
    ? !shouldDeliverParentBatch({
        requested: size,
        imported: earlyDash.imported_count,
        sourceExhausted: false,
        replacementUsed: false,
        counts: earlyDash.progress,
      })
    : false;

  await query(
    `UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW()
     WHERE parent_batch_id = $1 AND status != 'delivered'`,
    [parentBatch.id]
  );
  await query(`UPDATE parent_batches SET source_exhausted = true WHERE id = $1`, [parentBatch.id]);

  const finalDash = await getParentBatchDashboard(parentBatch.id);
  if (!finalDash) throw new Error('dashboard missing');
  const finalGateOpen = shouldDeliverParentBatch({
    requested: size,
    imported: finalDash.imported_count,
    sourceExhausted: true,
    replacementUsed: false,
    counts: finalDash.progress,
  });

  const claimedIds = (
    await query<{ id: string }>(
      `SELECT id FROM prospects WHERE parent_batch_id = $1 AND status = 'personalized_qa_passed'`,
      [parentBatch.id]
    )
  ).map((r) => r.id);

  const reconcile = reconcileDeliveryCounts({
    parentBatchId: parentBatch.id,
    requested: size,
    claimedIds,
    counts: finalDash.progress,
    csvRowCount: claimedIds.length,
    deliveryLedgerCount: claimedIds.length,
    sourceExhausted: true,
  });

  return {
    size,
    parentBatchId: parentBatch.id,
    inserted: intake.inserted,
    earlyGateBlocked,
    finalGateOpen,
    reconcileOk: reconcile.ok,
    dbCounts: finalDash.progress as unknown as Record<string, number>,
  };
}

async function cleanup(runIds: string[]): Promise<void> {
  for (const runId of runIds) {
    await query(`DELETE FROM prospects WHERE name LIKE $1`, [`Audit ${runId}%`]).catch(() => {});
    await query(`DELETE FROM parent_batches WHERE metadata->>'runId' = $1`, [runId]).catch(() => {});
  }
}

async function main(): Promise<void> {
  validateConfig();
  await applyMigrations();
  const auditClientId = await getAuditClientId();
  await ensureAuditCanRun(auditClientId);

  const results: AuditResult[] = [];
  const runIds: string[] = [];

  for (const size of SIZES) {
    console.log(`\n=== Audit Test ${size} prospects ===`);
    const r = await auditSize(size, auditClientId);
    results.push(r);
    const meta = await queryOne<{ runId: string }>(
      `SELECT metadata->>'runId' AS "runId" FROM parent_batches WHERE id = $1`,
      [r.parentBatchId]
    );
    if (meta?.runId) runIds.push(meta.runId);

    console.log(`  parent_batch_id: ${r.parentBatchId}`);
    console.log(`  inserted: ${r.inserted}`);
    console.log(`  early gate blocked: ${r.earlyGateBlocked}`);
    console.log(`  final gate open: ${r.finalGateOpen}`);
    console.log(`  reconcile ok: ${r.reconcileOk}`);
    console.log(`  qa_passed: ${r.dbCounts.personalized_qa_passed ?? 0}`);

    if (!r.earlyGateBlocked || !r.finalGateOpen || !r.reconcileOk) {
      throw new Error(`Audit failed for size ${size}`);
    }

    if (meta?.runId) {
      await cleanup([meta.runId]);
      runIds.length = 0;
    }
    await query(
      `UPDATE parent_batches SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [r.parentBatchId]
    ).catch(() => {});
  }

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  await pool.end();
  console.log('\n✅ All audit tests passed');
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

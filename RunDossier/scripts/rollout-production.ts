#!/usr/bin/env tsx
/**
 * Production rollout helper — migrations already applied separately.
 *
 *   npm exec tsx scripts/rollout-production.ts resolve-active
 *   npm exec tsx scripts/rollout-production.ts pilot-100
 *   npm exec tsx scripts/rollout-production.ts verify <parent_batch_id>
 *   npm exec tsx scripts/rollout-production.ts launch-1000
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool, query, queryOne } from '../src/db.js';
import { validateConfig, config } from '../src/config.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';
import { startParentBatch } from '../src/services/start-parent-batch.js';
import {
  getParentBatch,
  getParentBatchDashboard,
  resumeParentBatch,
  completeParentBatch,
  refreshParentBatchCounters,
  createParentBatch,
} from '../src/services/parent-batch.js';
import { reconcileDeliveryCounts } from '../src/utils/batch-reconciliation.js';
import { kickBatchOrchestrator } from '../src/utils/kick-orchestrator.js';
import { upsertSearchProfile, listSearchProfiles } from '../src/services/prospect-search.js';
import {
  loadColdEmailAgencyIcpConfig,
  resolveProfileSearchUrl,
} from '../src/config/icp-profiles.js';

const STUCK_BATCH_ID = 'd92e0d16-dc57-4846-83c3-b6c52e068e54';

function fakeProspect(i: number, runId: string, clientId: string) {
  const slug = `rollout${runId}${String(i).padStart(4, '0')}`.toLowerCase();
  return {
    name: `Rollout ${runId} ${i}`,
    linkedin_url: `https://www.linkedin.com/in/${slug}`,
    email: `${slug}@rollout-${runId}.test`,
    title: 'VP Sales',
    company: `RolloutCo ${runId} ${i}`,
    client_id: clientId,
  };
}

async function resolveActiveBatch(): Promise<void> {
  const batch = await getParentBatch(STUCK_BATCH_ID);
  if (!batch) {
    console.log(`Batch ${STUCK_BATCH_ID} not found — nothing to resolve.`);
    const active = await query(
      `SELECT id, client_id, status, requested_prospect_count, delivered_count, created_at
         FROM parent_batches
        WHERE status IN ('queued', 'processing', 'delivering', 'stalled')
        ORDER BY created_at DESC`
    );
    console.log('Active/stalled batches:', JSON.stringify(active, null, 2));
    return;
  }

  await refreshParentBatchCounters(batch.id);
  const dash = await getParentBatchDashboard(batch.id);
  console.log('Current batch state:', JSON.stringify(dash, null, 2));

  if (['completed', 'partial', 'failed'].includes(batch.status)) {
    console.log(`Batch already terminal: ${batch.status}`);
    return;
  }

  const progress = dash?.progress;
  const requested = batch.requested_prospect_count;
  const delivered = progress?.delivered ?? batch.delivered_count;
  const qaPassed = progress?.personalized_qa_passed ?? 0;
  const pipelineActive =
    (progress?.queued ?? 0) +
    (progress?.research_in_progress ?? 0) +
    (progress?.research_complete ?? 0) +
    (progress?.personalization_in_progress ?? 0) +
    (progress?.delivering ?? 0);

  if (pipelineActive > 0 || qaPassed > 0) {
    const resumed = await resumeParentBatch(batch.id);
    console.log(`Resumed batch ${batch.id} → status ${resumed?.status}`);
    await kickBatchOrchestrator(batch.id);
    console.log('Orchestrator kick enqueued (if queue running).');
    return;
  }

  const finalStatus = delivered >= requested ? 'completed' : 'partial';
  const ok = await completeParentBatch(batch.id, {
    status: finalStatus,
    errorMessage:
      delivered >= requested
        ? null
        : `Manual rollout closure: ${delivered}/${requested} delivered, pipeline idle`,
  });
  console.log(`Manually closed batch as ${finalStatus}: ${ok}`);
}

async function cancelBatch(parentBatchId: string, reason: string): Promise<void> {
  await query(
    `UPDATE prospects SET status = 'dead_letter', updated_at = NOW()
      WHERE parent_batch_id = $1 AND status NOT IN ('delivered', 'dead_letter')`,
    [parentBatchId]
  );
  const ok = await completeParentBatch(parentBatchId, {
    status: 'failed',
    errorMessage: reason,
  });
  console.log(`Cancelled batch ${parentBatchId}: ${ok}`);
}

function isValidRolloutLinkedin(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes('replace_with_real')) return false;
  return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-z0-9_%-]{3,100}\/?$/i.test(url.split('?')[0]);
}

async function launchPilotFresh(): Promise<string> {
  const files = ['scripts/prospects-batch.json'];
  const records: Array<{
    name: string;
    linkedin_url: string;
    email?: string;
    title?: string;
    company?: string;
    client_id: string;
  }> = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(process.cwd(), file), 'utf8')) as Array<Record<string, unknown>>;
    for (const row of raw) {
      const linkedin_url = String(row.linkedin_url ?? '').trim();
      if (!linkedin_url || !isValidRolloutLinkedin(linkedin_url)) continue;
      const dup = await queryOne<{ id: string }>(
        `SELECT id FROM prospects WHERE client_id = $1 AND lower(linkedin_url) = lower($2) LIMIT 1`,
        [DEFAULT_CLIENT_ID, linkedin_url]
      );
      if (dup) continue;
      records.push({
        name: String(row.name ?? 'Prospect'),
        linkedin_url,
        email: row.email ? String(row.email) : undefined,
        title: row.title ? String(row.title) : undefined,
        company: row.company ? String(row.company) : undefined,
        client_id: DEFAULT_CLIENT_ID,
      });
    }
  }

  if (records.length === 0) {
    throw new Error('Aucun prospect frais trouvé dans prospects-batch.json / prospects-test2.json');
  }

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
      LIMIT 1`,
    [DEFAULT_CLIENT_ID]
  );
  if (existing) {
    throw new Error(`Lot actif ${existing.id} — fermez-le d'abord (close <id>).`);
  }

  const runId = randomUUID().slice(0, 8);
  const { parentBatch, intake } = await startParentBatch({
    clientId: DEFAULT_CLIENT_ID,
    requestedCount: records.length,
    prospects: records,
    metadata: { rollout: 'pilot-fresh', runId, size: records.length, launched_at: new Date().toISOString() },
  });

  if (intake.inserted === 0) {
    await completeParentBatch(parentBatch.id, {
      status: 'failed',
      errorMessage: `0 prospects inserted (${intake.skipped} skipped dedup)`,
    });
    throw new Error(`Intake vide: ${intake.skipped} skipped. Tous les prospects existent déjà en DB.`);
  }

  if (intake.inserted !== records.length) {
    await query(
      `UPDATE parent_batches SET requested_prospect_count = $2, updated_at = NOW() WHERE id = $1`,
      [parentBatch.id, intake.inserted]
    );
    console.log(`Adjusted requested_count → ${intake.inserted} (skipped ${intake.skipped})`);
  }

  console.log(`\n=== pilot-fresh (${intake.inserted} insérés) ===`);
  console.log(`parent_batch_id: ${parentBatch.id}`);
  console.log(`inserted: ${intake.inserted} skipped: ${intake.skipped}`);
  return parentBatch.id;
}

async function launchPilotFromFile(size: number, label: string, file: string): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
      LIMIT 1`,
    [DEFAULT_CLIENT_ID]
  );
  if (existing) {
    throw new Error(
      `Client ${DEFAULT_CLIENT_ID} still has active batch ${existing.id}. Run cancel <id> first.`
    );
  }

  const raw = JSON.parse(readFileSync(join(process.cwd(), file), 'utf8')) as Array<Record<string, unknown>>;
  const records = raw.slice(0, size).map((row) => ({
    name: String(row.name ?? ''),
    linkedin_url: String(row.linkedin_url ?? ''),
    email: row.email ? String(row.email) : undefined,
    title: row.title ? String(row.title) : undefined,
    company: row.company ? String(row.company) : undefined,
    client_id: DEFAULT_CLIENT_ID,
  }));

  const runId = randomUUID().slice(0, 8);
  const { parentBatch, intake } = await startParentBatch({
    clientId: DEFAULT_CLIENT_ID,
    requestedCount: size,
    prospects: records,
    metadata: { rollout: label, runId, size, source_file: file, launched_at: new Date().toISOString() },
  });

  console.log(`\n=== ${label} launched ===`);
  console.log(`parent_batch_id: ${parentBatch.id}`);
  console.log(`requested: ${size}`);
  console.log(`inserted: ${intake.inserted} skipped: ${intake.skipped} invalid: ${intake.invalid}`);
  console.log(`source: ${file}`);
  console.log(`DELIVERY_CSV_ONLY: ${config.deliveryCsvOnly}`);
  return parentBatch.id;
}

async function launchPilot(size: number, label: string): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
      LIMIT 1`,
    [DEFAULT_CLIENT_ID]
  );
  if (existing) {
    throw new Error(
      `Client ${DEFAULT_CLIENT_ID} still has active batch ${existing.id}. Run resolve-active first.`
    );
  }

  const runId = randomUUID().slice(0, 8);
  const prospects = Array.from({ length: size }, (_, i) => fakeProspect(i + 1, runId, DEFAULT_CLIENT_ID));
  const { parentBatch, intake } = await startParentBatch({
    clientId: DEFAULT_CLIENT_ID,
    requestedCount: size,
    prospects,
    metadata: { rollout: label, runId, size, launched_at: new Date().toISOString() },
  });

  console.log(`\n=== ${label} launched ===`);
  console.log(`parent_batch_id: ${parentBatch.id}`);
  console.log(`requested: ${size}`);
  console.log(`inserted: ${intake.inserted} skipped: ${intake.skipped} invalid: ${intake.invalid}`);
  console.log(`DELIVERY_CSV_ONLY: ${config.deliveryCsvOnly}`);
  return parentBatch.id;
}

async function printStatus(): Promise<void> {
  const profiles = await query(
    `SELECT id, name, enabled FROM client_search_profiles WHERE client_id = $1`,
    [DEFAULT_CLIENT_ID]
  ).catch(() => []);
  const counts = await query<{ status: string; c: number }>(
    `SELECT status, COUNT(*)::int AS c FROM prospects WHERE client_id = $1 GROUP BY status ORDER BY c DESC`,
    [DEFAULT_CLIENT_ID]
  );
  const active = await query(
    `SELECT id, status, requested_prospect_count, imported_count, source_exhausted, metadata
       FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued','processing','delivering','stalled')
      ORDER BY created_at DESC`,
    [DEFAULT_CLIENT_ID]
  );
  const events = await query(
    `SELECT parent_batch_id, event_type, message, created_at FROM batch_events
      ORDER BY created_at DESC LIMIT 12`
  );
  console.log(JSON.stringify({ profiles, counts, active, events }, null, 2));
}

async function setupSourcing(searchUrlArg?: string): Promise<string[]> {
  const icp = loadColdEmailAgencyIcpConfig();
  const ids: string[] = [];

  for (const spec of icp.profiles) {
    const url =
      (spec.key === 'main' && searchUrlArg) ||
      resolveProfileSearchUrl(spec);
    if (!url) {
      console.warn(`Skip ${spec.name}: ${spec.env_url_key} not set`);
      continue;
    }

    const profile = await upsertSearchProfile({
      client_id: icp.client_id,
      name: spec.name,
      search_url: url,
      title_keywords: spec.title_keywords,
      min_employees: spec.min_employees,
      max_employees: spec.max_employees,
      min_icp_score: spec.min_icp_score,
      max_results_per_run: spec.max_results_per_run,
      enrich_profiles: spec.enrich_profiles,
      enabled: spec.enabled,
    });
    console.log(`Search profile ready: ${profile.id} (${profile.name})`);
    ids.push(profile.id);
  }

  if (ids.length === 0) {
    throw new Error(
      'Aucune URL Sales Navigator — configurez APIFY_SALES_NAV_SEARCH_URL (et optionnellement _CONSULTING) puis relancez setup-sourcing'
    );
  }
  return ids;
}

async function launchSourcedBatch(size: number, label: string): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM parent_batches
      WHERE client_id = $1 AND status IN ('queued', 'processing', 'delivering')
      LIMIT 1`,
    [DEFAULT_CLIENT_ID]
  );
  if (existing) {
    throw new Error(`Active batch ${existing.id} — run cancel or wait for completion first.`);
  }

  const profiles = await query<{ id: string }>(
    `SELECT id FROM client_search_profiles WHERE client_id = $1 AND enabled = true`,
    [DEFAULT_CLIENT_ID]
  ).catch(() => []);
  if (profiles.length === 0) {
    throw new Error(
      'No enabled client_search_profiles — run: npm exec tsx scripts/rollout-production.ts setup-sourcing'
    );
  }

  const runId = randomUUID().slice(0, 8);
  const parentBatch = await createParentBatch({
    clientId: DEFAULT_CLIENT_ID,
    requestedCount: size,
    metadata: { rollout: label, runId, size, mode: 'sourced', launched_at: new Date().toISOString() },
  });
  await kickBatchOrchestrator(parentBatch.id);
  console.log(`\n=== ${label} (sourced) launched ===`);
  console.log(`parent_batch_id: ${parentBatch.id}`);
  console.log(`requested: ${size} | search_profiles: ${profiles.length}`);
  return parentBatch.id;
}

async function closeStuckBatch(parentBatchId: string): Promise<void> {
  if (!parentBatchId) throw new Error('Usage: close <parent_batch_id>');
  await refreshParentBatchCounters(parentBatchId);
  const dash = await getParentBatchDashboard(parentBatchId);
  if (!dash) throw new Error('Batch not found');
  const status = dash.delivered_count >= dash.requested_prospect_count ? 'completed' : 'partial';
  await completeParentBatch(parentBatchId, {
    status,
    errorMessage:
      dash.imported_count === 0
        ? `Rollout closed: 0 imported (dedup or no sourcing). ${dash.delivered_count}/${dash.requested_prospect_count} delivered.`
        : null,
  });
  console.log(`Closed ${parentBatchId} as ${status}`);
}

async function verifyBatch(parentBatchId: string): Promise<void> {
  await refreshParentBatchCounters(parentBatchId);
  const dash = await getParentBatchDashboard(parentBatchId);
  if (!dash) throw new Error('Batch not found');

  const events = await query(
    `SELECT event_type, message, created_at FROM batch_events
      WHERE parent_batch_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [parentBatchId]
  );

  const dbProspectCounts = await query<{ status: string; count: string }>(
    `SELECT trim(status) AS status, COUNT(*)::text AS count
       FROM prospects WHERE parent_batch_id = $1 GROUP BY trim(status)`,
    [parentBatchId]
  );

  const claimed = (
    await query<{ id: string }>(
      `SELECT id FROM prospects
        WHERE parent_batch_id = $1 AND status = 'personalized_qa_passed'`,
      [parentBatchId]
    )
  ).map((r) => r.id);

  const reconcile = reconcileDeliveryCounts({
    parentBatchId,
    requested: dash.requested_prospect_count,
    claimedIds: claimed,
    counts: dash.progress,
    csvRowCount: claimed.length,
    deliveryLedgerCount: claimed.length,
    sourceExhausted: dash.source_exhausted,
  });

  const costRow = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(cost_usd), 0)::text AS total
       FROM cost_ledger
      WHERE metadata->>'parent_batch_id' = $1`,
    [parentBatchId]
  ).catch(() => null);

  console.log('\n=== Dashboard ===');
  console.log(JSON.stringify(dash, null, 2));
  console.log('\n=== DB prospect status counts ===');
  console.log(JSON.stringify(dbProspectCounts, null, 2));
  console.log('\n=== Reconciliation (ready to deliver) ===');
  console.log(JSON.stringify(reconcile, null, 2));
  console.log('\n=== Cost ledger (parent_batch) ===');
  console.log(`total_usd: ${costRow?.total ?? '0'}`);
  console.log('\n=== Recent batch_events ===');
  console.log(JSON.stringify(events, null, 2));

  let mismatch = false;
  for (const row of dbProspectCounts) {
    const key = row.status as keyof typeof dash.progress;
    const dashVal = dash.progress[key];
    if (typeof dashVal === 'number' && Number(row.count) !== dashVal) {
      console.error(`MISMATCH status ${row.status}: DB=${row.count} dashboard=${dashVal}`);
      mismatch = true;
    }
  }
  if (mismatch) {
    throw new Error('Dashboard counts do not match DB');
  }
  console.log('\n✅ Dashboard counts match DB');
}

async function main(): Promise<void> {
  validateConfig();
  const cmd = process.argv[2] ?? 'help';

  switch (cmd) {
    case 'resolve-active':
      await resolveActiveBatch();
      break;
    case 'cancel': {
      const id = process.argv[3];
      const reason = process.argv[4] ?? 'Manual rollout cancellation';
      if (!id) throw new Error('Usage: cancel <parent_batch_id> [reason]');
      await cancelBatch(id, reason);
      break;
    }
    case 'setup-icp': {
      const { spawnSync } = await import('node:child_process');
      const args = ['exec', 'tsx', 'scripts/setup-icp-searches.ts', '--', '--apply'];
      if (process.argv[3]) args.push('--main-url', process.argv[3]);
      if (process.argv[4]) args.push('--consulting-url', process.argv[4]);
      spawnSync('npm', args, { cwd: process.cwd(), stdio: 'inherit', shell: true });
      break;
    }
    case 'setup-sourcing':
      await setupSourcing(process.argv[3]);
      break;
    case 'pilot-fresh':
      await launchPilotFresh();
      break;
    case 'pilot-100-sourced':
      await setupSourcing().catch(() => {});
      await launchSourcedBatch(100, 'pilot-100-sourced');
      break;
    case 'pilot-100':
      await launchPilotFromFile(100, 'pilot-100', 'scripts/prospects-100.json');
      break;
    case 'pilot-100-fake':
      await launchPilot(100, 'pilot-100-fake');
      break;
    case 'launch-1000':
      await setupSourcing().catch(() => {});
      await launchSourcedBatch(1000, 'production-1000');
      break;
    case 'relaunch-pilot': {
      const active = await queryOne<{ id: string }>(
        `SELECT id FROM parent_batches WHERE client_id = $1 AND status IN ('queued','processing','delivering') LIMIT 1`,
        [DEFAULT_CLIENT_ID]
      );
      if (active) await closeStuckBatch(active.id);
      const pilotId = await launchPilotFresh();
      await verifyBatch(pilotId);
      break;
    }
    case 'continue-rollout': {
      const pilotId = await launchPilotFresh();
      await verifyBatch(pilotId);
      console.log('\n✅ Pilote frais lancé — workers en traitement.');
      console.log('Surveillance: npm exec tsx scripts/rollout-production.ts status');
      console.log('Pour 1 000: configurez APIFY_SALES_NAV_SEARCH_URL puis setup-sourcing + launch-1000');
      break;
    }
    case 'diagnose': {
      const { spawnSync } = await import('node:child_process');
      spawnSync('npm', ['exec', 'tsx', 'scripts/rollout-diagnose.ts'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      });
      break;
    }
    case 'close':
      await closeStuckBatch(process.argv[3] ?? '');
      break;
    case 'status':
      await printStatus();
      break;
    case 'verify': {
      const id = process.argv[3];
      if (!id) throw new Error('Usage: verify <parent_batch_id>');
      await verifyBatch(id);
      break;
    }
    default:
      console.log(`Commands: setup-icp | setup-sourcing [main-url] | relaunch-pilot | pilot-fresh | continue-rollout | status | launch-1000 | verify <id> | close <id>`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

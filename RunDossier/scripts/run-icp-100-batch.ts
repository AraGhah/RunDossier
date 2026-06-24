#!/usr/bin/env tsx
/**
 * Orchestrate a 100-prospect cold-email agency batch (W1 → W5).
 *
 *   npm exec tsx scripts/run-icp-100-batch.ts -- --search-url "https://linkedin.com/sales/search/..."
 *   npm exec tsx scripts/run-icp-100-batch.ts -- --target 100 --provider gmail
 *
 * Requires: DATABASE_URL, ANTHROPIC, GOOGLE, APIFY, Sales Navigator URL.
 * Email: GMAIL_* or RESEND (client contact_email).
 */
import 'dotenv/config';
import { pool, query, queryOne } from '../src/db.js';
import { config, validateConfig } from '../src/config.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';
import {
  getSearchProfile,
  runProspectSearch,
  upsertSearchProfile,
} from '../src/services/prospect-search.js';
import { loadColdEmailAgencyIcpConfig, resolveProfileSearchUrl } from '../src/config/icp-profiles.js';
import { createWorkflowRun, updateWorkflowRun } from '../src/services/workflow-run.js';
import { runScheduler } from '../src/jobs/scheduler.job.js';
import { handleResearch } from '../src/jobs/research.job.js';
import { handlePersonalize } from '../src/jobs/personalize.job.js';
import { runDeliveryForClient } from '../src/jobs/delivery.job.js';
import { deliveryEmailConfigured } from '../src/utils/send-delivery-email.js';
import { notify } from '../src/notify.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

const TARGET = parseInt(arg('--target') ?? '100', 10) || 100;
const CLIENT_ID = arg('--client-id') ?? DEFAULT_CLIENT_ID;
const SEARCH_URL = arg('--search-url') ?? config.apifySalesNavSearchUrl;
const PROFILE_ID = arg('--profile-id');
const DISCOVERY_BUFFER = 1.4; // ingest extra to absorb thin_research / QA failures

interface PipelineCounts {
  queued: number;
  research_in_progress: number;
  research_complete: number;
  thin_research: number;
  research_failed: number;
  personalization_in_progress: number;
  personalized_qa_passed: number;
  qa_failed: number;
  personalization_failed: number;
  delivered: number;
}

async function getCounts(clientId: string): Promise<PipelineCounts> {
  const row = await queryOne<Record<string, string>>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'queued')::text AS queued,
       COUNT(*) FILTER (WHERE status = 'research_in_progress')::text AS research_in_progress,
       COUNT(*) FILTER (WHERE status = 'research_complete')::text AS research_complete,
       COUNT(*) FILTER (WHERE status = 'thin_research')::text AS thin_research,
       COUNT(*) FILTER (WHERE status = 'research_failed')::text AS research_failed,
       COUNT(*) FILTER (WHERE status = 'personalization_in_progress')::text AS personalization_in_progress,
       COUNT(*) FILTER (WHERE status = 'personalized_qa_passed')::text AS personalized_qa_passed,
       COUNT(*) FILTER (WHERE status = 'qa_failed')::text AS qa_failed,
       COUNT(*) FILTER (WHERE status = 'personalization_failed')::text AS personalization_failed,
       COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered
     FROM prospects WHERE client_id = $1`,
    [clientId]
  );
  return {
    queued: Number(row?.queued ?? 0),
    research_in_progress: Number(row?.research_in_progress ?? 0),
    research_complete: Number(row?.research_complete ?? 0),
    thin_research: Number(row?.thin_research ?? 0),
    research_failed: Number(row?.research_failed ?? 0),
    personalization_in_progress: Number(row?.personalization_in_progress ?? 0),
    personalized_qa_passed: Number(row?.personalized_qa_passed ?? 0),
    qa_failed: Number(row?.qa_failed ?? 0),
    personalization_failed: Number(row?.personalization_failed ?? 0),
    delivered: Number(row?.delivered ?? 0),
  };
}

async function processResearchBatch(clientId: string, limit: number): Promise<number> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE client_id = $1 AND status = 'queued'
     ORDER BY icp_fit_score DESC NULLS LAST, created_at
     LIMIT $2`,
    [clientId, limit]
  );
  let done = 0;
  for (const { id } of rows) {
    await query(
      `UPDATE prospects SET status = 'research_in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'queued'`,
      [id]
    );
    try {
      await handleResearch({ data: { prospectId: id } });
      done += 1;
      console.log(`  [W3] researched ${id.slice(0, 8)}…`);
    } catch (err) {
      console.warn(`  [W3] failed ${id.slice(0, 8)}…:`, (err as Error).message);
    }
  }
  return done;
}

async function processPersonalizeBatch(clientId: string, limit: number): Promise<number> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE client_id = $1 AND status IN ('research_complete', 'qa_failed', 'personalization_failed')
     ORDER BY confidence_score DESC NULLS LAST, updated_at
     LIMIT $2`,
    [clientId, limit]
  );
  let done = 0;
  for (const { id } of rows) {
    try {
      await handlePersonalize({ data: { prospectId: id } });
      done += 1;
      console.log(`  [W4] personalized ${id.slice(0, 8)}…`);
    } catch (err) {
      console.warn(`  [W4] failed ${id.slice(0, 8)}…:`, (err as Error).message);
    }
  }
  return done;
}

async function ensureSearchProfile(): Promise<string> {
  if (PROFILE_ID) {
    const p = await getSearchProfile(PROFILE_ID);
    if (!p) throw new Error(`Search profile not found: ${PROFILE_ID}`);
    return p.id;
  }

  const icp = loadColdEmailAgencyIcpConfig();
  const mainSpec = icp.profiles.find((p) => p.key === 'main');
  if (!mainSpec) throw new Error('ICP config missing main profile');

  const searchUrl = SEARCH_URL?.trim() || resolveProfileSearchUrl(mainSpec);
  if (!searchUrl) {
    throw new Error(
      'Missing Sales Navigator URL. Set APIFY_SALES_NAV_SEARCH_URL or pass --search-url'
    );
  }

  const profile = await upsertSearchProfile({
    client_id: CLIENT_ID,
    name: mainSpec.name,
    search_url: searchUrl,
    title_keywords: mainSpec.title_keywords,
    min_employees: mainSpec.min_employees,
    max_employees: mainSpec.max_employees,
    min_icp_score: mainSpec.min_icp_score,
    max_results_per_run: Math.min(mainSpec.max_results_per_run, Math.max(50, TARGET)),
    enrich_profiles: mainSpec.enrich_profiles,
    enabled: true,
  });
  console.log(`Search profile ready: ${profile.id} (${profile.name})`);
  return profile.id;
}

async function discoverProspects(profileId: string, ingestGoal: number): Promise<number> {
  let totalIngested = 0;
  let runs = 0;
  const maxRuns = 5;

  while (totalIngested < ingestGoal && runs < maxRuns) {
    runs += 1;
    console.log(`\n[W1] Search run ${runs}/${maxRuns}…`);
    const result = await runProspectSearch(profileId);
    totalIngested += result.ingested;
    console.log(
      `  found=${result.leadsFound} ingested=${result.ingested} skipped=${result.skipped} enriched=${result.enriched}`
    );
    if (result.ingested === 0) break;
  }
  return totalIngested;
}

async function main(): Promise<void> {
  validateConfig();

  if (arg('--provider') === 'gmail' && !config.gmailUser) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD required for --provider gmail');
  }
  if (!deliveryEmailConfigured()) {
    throw new Error('No email provider configured (RESEND_API_KEY or GMAIL_*)');
  }

  const client = await queryOne<{ id: string; name: string; contact_email: string | null }>(
    `SELECT id, name, contact_email FROM clients WHERE id = $1`,
    [CLIENT_ID]
  );
  if (!client) throw new Error(`Client not found: ${CLIENT_ID}`);

  console.log(`=== ICP batch: ${TARGET} cold-email agency prospects ===`);
  console.log(`Client: ${client.name} (${client.contact_email ?? 'no email'})`);

  const run = await createWorkflowRun({ triggerSource: 'icp-100-batch', triggerRef: `target-${TARGET}` });

  try {
    await updateWorkflowRun(run.id, { stage: 'searching' });
    const profileId = await ensureSearchProfile();
    const ingestGoal = Math.ceil(TARGET * DISCOVERY_BUFFER);
    const ingested = await discoverProspects(profileId, ingestGoal);

    await updateWorkflowRun(run.id, {
      prospects_found: ingested,
      prospects_ingested: ingested,
      stage: ingested > 0 ? 'researching' : 'failed',
      status: ingested > 0 ? 'running' : 'failed',
      error_message: ingested > 0 ? null : 'No prospects ingested — check Sales Navigator URL/cookie',
    });

    if (ingested === 0) {
      throw new Error('Discovery produced 0 prospects');
    }

    await updateWorkflowRun(run.id, { stage: 'researching' });

    const maxCycles = TARGET * 3;
    for (let cycle = 0; cycle < maxCycles; cycle += 1) {
      const counts = await getCounts(CLIENT_ID);
      console.log(
        `\n[Pipeline] ready=${counts.personalized_qa_passed} queued=${counts.queued} ` +
          `research_complete=${counts.research_complete} thin=${counts.thin_research} delivered=${counts.delivered}`
      );

      if (counts.personalized_qa_passed >= TARGET) break;

      await runScheduler().catch((e) => console.warn('[scheduler]', (e as Error).message));

      if (counts.queued > 0) {
        await processResearchBatch(CLIENT_ID, Math.min(3, counts.queued));
      }
      const afterResearch = await getCounts(CLIENT_ID);
      const personalizePending =
        afterResearch.research_complete + afterResearch.qa_failed + afterResearch.personalization_failed;
      if (personalizePending > 0) {
        await updateWorkflowRun(run.id, { stage: 'personalizing' });
        await processPersonalizeBatch(CLIENT_ID, Math.min(2, personalizePending));
      }

      const refreshed = await getCounts(CLIENT_ID);
      if (
        refreshed.personalized_qa_passed >= TARGET ||
        (refreshed.queued === 0 &&
          refreshed.research_in_progress === 0 &&
          refreshed.research_complete === 0 &&
          refreshed.personalization_in_progress === 0 &&
          refreshed.qa_failed === 0 &&
          refreshed.personalization_failed === 0)
      ) {
        break;
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    const finalCounts = await getCounts(CLIENT_ID);
    await updateWorkflowRun(run.id, {
      prospects_thin_research: finalCounts.thin_research,
      prospects_delivered: finalCounts.delivered,
    });

    if (finalCounts.personalized_qa_passed < TARGET) {
      await updateWorkflowRun(run.id, {
        stage: 'failed',
        status: 'partial',
        error_message: `Only ${finalCounts.personalized_qa_passed}/${TARGET} passed QA — not delivering partial batch`,
        completed: true,
      });
      await notify(
        `ICP batch incomplete: ${finalCounts.personalized_qa_passed}/${TARGET} QA-passed. ` +
          `thin=${finalCounts.thin_research} failed=${finalCounts.research_failed + finalCounts.qa_failed}`
      );
      console.error(`\n❌ Insufficient QA-passed prospects: ${finalCounts.personalized_qa_passed}/${TARGET}`);
      process.exitCode = 1;
      return;
    }

    await updateWorkflowRun(run.id, { stage: 'delivering' });

    const delivered = await runDeliveryForClient(CLIENT_ID, { limit: TARGET });
    const delivery = await queryOne<{ id: string; status: string; provider_message_id: string | null }>(
      `SELECT id, status, provider_message_id FROM deliveries
       WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [CLIENT_ID]
    );

    await updateWorkflowRun(run.id, {
      stage: 'completed',
      status: 'completed',
      prospects_delivered: delivered,
      completed: true,
      metadata: {
        delivery_id: delivery?.id ?? null,
        provider_message_id: delivery?.provider_message_id ?? null,
        target: TARGET,
      },
    });

    console.log('\n✅ Batch complete');
    console.log(`  Run ID: ${run.id}`);
    console.log(`  Delivered: ${delivered}`);
    console.log(`  Delivery ID: ${delivery?.id ?? 'n/a'}`);
    console.log(`  Email status: ${delivery?.status ?? 'n/a'}`);
    console.log(`  Message ID: ${delivery?.provider_message_id ?? 'n/a'}`);

    await notify(
      `ICP 100 batch complete — ${delivered} prospects delivered\nRun: ${run.id}\nDelivery: ${delivery?.id ?? 'n/a'}`
    );
  } catch (err) {
    const message = (err as Error).message;
    await updateWorkflowRun(run.id, {
      stage: 'failed',
      status: 'failed',
      error_message: message,
      completed: true,
    });
    await notify(`ICP 100 batch failed: ${message}`).catch(() => {});
    throw err;
  } finally {
    await pool.end();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

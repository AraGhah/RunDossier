import { PgBoss } from 'pg-boss';
import { config } from './config.js';
import { getPgSslConfig, logDatabaseSslConfig } from './pg-ssl.js';
import { handleResearch } from './jobs/research.job.js';
import { handlePersonalize } from './jobs/personalize.job.js';
import { runScheduler } from './jobs/scheduler.job.js';
import { runDelivery } from './jobs/delivery.job.js';
import { runPipelineDigest } from './jobs/pipeline-digest.job.js';
import { runDogfoodScrape } from './jobs/dogfood-scrape.job.js';
import { runDogfoodPromote } from './jobs/dogfood-promote.job.js';
import { runProspectSearchJob } from './jobs/prospect-search.job.js';
import { runPiiRetention } from './jobs/pii-retention.job.js';
import { runOnboardingTimers } from './jobs/onboarding-timers.job.js';
import { runFailureDigest } from './jobs/failure-digest.job.js';
import { runCostGovernor } from './jobs/cost-governor.job.js';

const QUEUES = ['research', 'personalize', 'scheduler', 'delivery', 'dogfood-scrape', 'dogfood-promote', 'prospect-search', 'pii-retention', 'onboarding-timers', 'failure-digest', 'cost-governor'] as const;

/** pg-boss retries for transient worker failures (API timeouts, network blips). */
const TRANSIENT_JOB_OPTIONS = {
  retryLimit: 3,
  retryBackoff: true,
} as const;

let boss: PgBoss;

export function getBoss(): PgBoss { return boss; }

export async function startQueue(): Promise<void> {
  logDatabaseSslConfig();
  boss = new PgBoss({
    connectionString: config.databaseUrl,
    ssl: getPgSslConfig(),
    maintenanceIntervalSeconds: 300,
  });
  boss.on('error', (err: Error) => console.error('[pg-boss] error:', err));
  await boss.start();

  for (const name of QUEUES) {
    await boss.createQueue(name, { deleteAfterSeconds: 259200 });
  }

  await boss.work<{ prospectId: string }>(
    'research',
    { localConcurrency: 1, ...TRANSIENT_JOB_OPTIONS },
    async (jobs) => {
      for (const job of jobs) await handleResearch(job);
    }
  );
  await boss.work<{ prospectId: string }>(
    'personalize',
    { localConcurrency: 1, ...TRANSIENT_JOB_OPTIONS },
    async (jobs) => {
      for (const job of jobs) await handlePersonalize(job);
    }
  );

  await boss.schedule('scheduler', '*/5 * * * *');
  await boss.work('scheduler', async (jobs) => {
    for (const _job of jobs) await runScheduler();
  });

  await boss.schedule('delivery', '0 * * * *');
  await boss.work('delivery', async (jobs) => {
    for (const _job of jobs) {
      try {
        const summary = await runDelivery();
        await runPipelineDigest(summary);
      } catch (err) {
        console.error('[delivery] job error:', err);
        await runPipelineDigest({
          clientsProcessed: 0,
          prospectsDelivered: 0,
          details: [],
          errors: [(err as Error).message],
        }).catch((digestErr) => console.error('[digest] error:', digestErr));
      }
    }
  });

  await boss.schedule('dogfood-scrape', '0 */6 * * *');
  await boss.work('dogfood-scrape', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runDogfoodScrape();
      } catch (err) {
        console.error('[dogfood-scrape] job error:', err);
      }
    }
  });

  await boss.schedule('dogfood-promote', '*/15 * * * *');
  await boss.work('dogfood-promote', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runDogfoodPromote();
      } catch (err) {
        console.error('[dogfood-promote] job error:', err);
      }
    }
  });

  await boss.schedule('prospect-search', '0 7 * * *');
  await boss.work('prospect-search', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runProspectSearchJob();
      } catch (err) {
        console.error('[prospect-search] job error:', err);
      }
    }
  });

  await boss.schedule('pii-retention', '0 3 * * *');
  await boss.work('pii-retention', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runPiiRetention();
      } catch (err) {
        console.error('[pii-retention] job error:', err);
      }
    }
  });

  await boss.schedule('onboarding-timers', '20 * * * *');
  await boss.work('onboarding-timers', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runOnboardingTimers();
      } catch (err) {
        console.error('[onboarding-timers] job error:', err);
      }
    }
  });

  // Daily ops pulse at 08:00 - dead-letter / failure digest.
  // Cost Governor v1 — daily 01:00. Tier soft-caps + global ceiling -> Telegram alert.
  await boss.schedule('cost-governor', '0 1 * * *');
  await boss.work('cost-governor', async (jobs) => {
    for (const _job of jobs) await runCostGovernor();
  });

  await boss.schedule('failure-digest', '0 8 * * *');
  await boss.work('failure-digest', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runFailureDigest();
      } catch (err) {
        console.error('[failure-digest] job error:', err);
      }
    }
  });

  console.log('[queue] Started - jobs registered');
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 10_000 });
    console.log('[queue] Stopped gracefully');
  }
}

/** Connectivity check only - does not register workers or run jobs. */
export async function probePgBoss(): Promise<void> {
  const probe = new PgBoss({
    connectionString: config.databaseUrl,
    ssl: getPgSslConfig(),
    maintenanceIntervalSeconds: 300,
  });  probe.on('error', (err: Error) => console.error('[pg-boss] probe error:', err));
  await probe.start();
  for (const name of QUEUES) {
    await probe.createQueue(name, { deleteAfterSeconds: 259200 });
  }
  await probe.stop({ graceful: true, timeout: 10_000 });
}

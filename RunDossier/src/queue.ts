import { PgBoss } from 'pg-boss';
import { config } from './config.js';
import { getPgSslConfig, logDatabaseSslConfig } from './pg-ssl.js';
import { handleResearch } from './jobs/research.job.js';
import { handlePersonalize } from './jobs/personalize.job.js';
import { runScheduler } from './jobs/scheduler.job.js';
import { runDelivery } from './jobs/delivery.job.js';
import { runDogfoodScrape } from './jobs/dogfood-scrape.job.js';
import { runDogfoodPromote } from './jobs/dogfood-promote.job.js';
import { runProspectSearchJob } from './jobs/prospect-search.job.js';

const QUEUES = ['research', 'personalize', 'scheduler', 'delivery', 'dogfood-scrape', 'dogfood-promote', 'prospect-search'] as const;

/** pg-boss retries for transient worker failures (API timeouts, network blips). */
const TRANSIENT_JOB_OPTIONS = {
  retryLimit: 3,
  retryBackoff: true,
} as const;

let boss: PgBoss;

export function getBoss(): PgBoss { return boss; }

export async function startQueue(): Promise<void> {
  logDatabaseSslConfig();
  boss = new PgBoss({    connectionString: config.databaseUrl,
    ssl: getPgSslConfig(),
  });
  boss.on('error', (err: Error) => console.error('[pg-boss] error:', err));
  await boss.start();

  for (const name of QUEUES) {
    await boss.createQueue(name);
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

  await boss.schedule('delivery', '*/15 * * * *');
  await boss.work('delivery', async (jobs) => {
    for (const _job of jobs) {
      try {
        await runDelivery();
      } catch (err) {
        console.error('[delivery] job error:', err);
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

  console.log('[queue] Started — jobs registered');
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 10_000 });
    console.log('[queue] Stopped gracefully');
  }
}

/** Connectivity check only — does not register workers or run jobs. */
export async function probePgBoss(): Promise<void> {
  const probe = new PgBoss({
    connectionString: config.databaseUrl,
    ssl: getPgSslConfig(),
  });  probe.on('error', (err: Error) => console.error('[pg-boss] probe error:', err));
  await probe.start();
  for (const name of QUEUES) {
    await probe.createQueue(name);
  }
  await probe.stop({ graceful: true, timeout: 10_000 });
}

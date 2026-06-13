import { PgBoss } from 'pg-boss';
import { config } from './config.js';
import { handleResearch } from './jobs/research.job.js';
import { handlePersonalize } from './jobs/personalize.job.js';
import { runScheduler } from './jobs/scheduler.job.js';

const QUEUES = ['research', 'personalize', 'scheduler'] as const;

let boss: PgBoss;

export function getBoss() { return boss; }

export async function startQueue() {
  boss = new PgBoss({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  });

  boss.on('error', (err: Error) => console.error('pg-boss error:', err));

  await boss.start();

  for (const name of QUEUES) {
    await boss.createQueue(name);
  }

  await boss.work<{ prospectId: string }>('research', { localConcurrency: 2 }, async (jobs) => {
    for (const job of jobs) await handleResearch(job);
  });
  await boss.work<{ prospectId: string }>('personalize', { localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) await handlePersonalize(job);
  });

  await boss.schedule('scheduler', '*/5 * * * *');
  await boss.work('scheduler', async (jobs) => {
    for (const _job of jobs) await runScheduler();
  });

  console.log('Queue started, jobs registered');
}

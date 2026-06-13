import PgBoss from 'pg-boss';
import { config } from './config.js';

let boss: PgBoss;

export async function getQueue(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss(config.databaseUrl);
    await boss.start();
  }
  return boss;
}

export async function stopQueue(): Promise<void> {
  if (boss) await boss.stop();
}

export const JOB_NAMES = {
  RESEARCH: 'research',
  PERSONALIZE: 'personalize',
  QA: 'qa',
  DELIVERY: 'delivery',
  SCHEDULER: 'scheduler',
} as const;

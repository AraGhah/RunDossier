/**
 * Run the daily failure digest once, on demand (clean shutdown — no libuv crash).
 *   npx tsx scripts/run-failure-digest.ts
 */
import 'dotenv/config';
import { runFailureDigest } from '../src/jobs/failure-digest.job.js';
import { pool } from '../src/db.js';

async function main(): Promise<void> {
  await runFailureDigest();
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});

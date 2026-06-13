/**
 * Manual trigger for Workflow 10 scrape (same logic as cron).
 * Usage: npx tsx scripts/run-dogfood-scrape.ts
 */
import 'dotenv/config';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { runDogfoodScrape } from '../src/jobs/dogfood-scrape.job.js';
import { runDogfoodPromote } from '../src/jobs/dogfood-promote.job.js';

async function main(): Promise<void> {
  validateConfig();
  const scrape = await runDogfoodScrape();
  console.log('Scrape:', scrape);
  const promote = await runDogfoodPromote();
  console.log('Promote:', promote);
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

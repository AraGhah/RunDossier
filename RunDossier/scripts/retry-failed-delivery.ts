#!/usr/bin/env tsx
/**
 * Reset prospects incorrectly marked delivered without email_sent, then retry W5.
 *
 *   npm run delivery:repair -- --dry-run
 *   npm run delivery:retry
 *   npm run delivery:retry -- --client-id <uuid> --limit 50
 */
import 'dotenv/config';
import { pool } from '../src/db.js';
import { validateConfig, config } from '../src/config.js';
import { countMisdeliveredProspects, repairMisdeliveredProspects } from '../src/services/delivery-repair.js';
import { runDeliveryForClient } from '../src/jobs/delivery.job.js';
import { deliveryEmailConfigured } from '../src/utils/send-delivery-email.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  validateConfig();
  const dryRun = process.argv.includes('--dry-run');
  const clientId = arg('--client-id');
  const limit = arg('--limit') ? parseInt(arg('--limit')!, 10) : undefined;

  const misdelivered = await countMisdeliveredProspects(clientId);
  console.log(`Misdelivered prospects (no email_sent ledger): ${misdelivered}`);
  console.log(`Email provider configured: ${deliveryEmailConfigured()}`);
  console.log(`DELIVERY_CSV_ONLY: ${config.deliveryCsvOnly}`);

  if (misdelivered === 0) {
    console.log('Nothing to repair.');
    await pool.end();
    return;
  }

  if (dryRun) {
    console.log('Dry-run — no changes.');
    await pool.end();
    return;
  }

  if (!deliveryEmailConfigured() && !config.deliveryCsvOnly) {
    console.error('Configure RESEND_API_KEY (+ DELIVERY_FROM_EMAIL) or GMAIL_USER+GMAIL_APP_PASSWORD first.');
    await pool.end();
    process.exit(1);
  }

  const repair = await repairMisdeliveredProspects(clientId);
  console.log(`Reset ${repair.resetCount} prospect(s) to personalized_qa_passed.`);

  let totalDelivered = 0;
  for (const cid of repair.clientIds) {
    const n = await runDeliveryForClient(cid, limit ? { limit } : undefined);
    totalDelivered += n;
    console.log(`Client ${cid}: ${n} prospect(s) delivered with confirmed email.`);
  }

  const remaining = await countMisdeliveredProspects(clientId);
  console.log(`\nDone. Delivered this run: ${totalDelivered}. Remaining misdelivered: ${remaining}.`);
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

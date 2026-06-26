/**
 * Manually trigger the delivery job right now (don't wait for the hourly tick).
 * Runs runDelivery() for all clients with personalized_qa_passed prospects.
 *
 * Usage:
 *   npx tsx scripts/trigger-delivery.ts
 *
 * Prerequisites:
 *   - At least one prospect in status 'personalized_qa_passed'
 *   - Client record has a valid contact_email, OR GMAIL_DELIVERY_TO is set
 *   - Email provider configured (RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD)
 *     or set DELIVERY_CSV_ONLY=true to finalize without sending an email
 */
import 'dotenv/config';
import { pool, query } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { runDelivery } from '../src/jobs/delivery.job.js';
import { deliveryEmailConfigured } from '../src/utils/send-delivery-email.js';
import { config } from '../src/config.js';

async function main(): Promise<void> {
  validateConfig();

  // Preflight: count prospects ready to deliver
  const [ready] = await query<{ count: string; client_count: string }>(
    `SELECT COUNT(*)::text AS count,
            COUNT(DISTINCT client_id)::text AS client_count
     FROM prospects WHERE status = 'personalized_qa_passed' AND client_id IS NOT NULL`
  );

  console.log(`\n=== trigger-delivery ===`);
  console.log(`Ready prospects : ${ready?.count ?? 0}`);
  console.log(`Distinct clients: ${ready?.client_count ?? 0}`);
  console.log(`Email provider  : ${deliveryEmailConfigured() ? 'configured' : 'NOT configured'}`);
  console.log(`CSV-only mode   : ${config.deliveryCsvOnly}`);
  console.log(`Admin copy to   : ${config.gmailDeliveryTo || '(not set)'}`);

  const clients = await query<{ id: string; name: string; contact_email: string | null }>(
    `SELECT DISTINCT c.id, c.name, c.contact_email
     FROM clients c
     JOIN prospects p ON p.client_id = c.id AND p.status = 'personalized_qa_passed'
     ORDER BY c.name`
  );
  if (clients.length > 0) {
    console.log('\nClients in queue:');
    for (const c of clients) {
      console.log(`  ${c.name} — recipient: ${c.contact_email ?? '(no email set)'}`);
    }
  }

  if (Number(ready?.count ?? 0) === 0) {
    console.log('\nNothing to deliver. Run rescue-dead-letter.ts --apply first.');
    await pool.end();
    return;
  }

  if (!deliveryEmailConfigured() && !config.deliveryCsvOnly) {
    console.log('\nNo email provider and DELIVERY_CSV_ONLY is not set.');
    console.log('Set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD, or set DELIVERY_CSV_ONLY=true');
    console.log('to finalize delivery without sending an email (CSV is saved to disk).');
    await pool.end();
    return;
  }

  console.log('\nRunning delivery...');
  const summary = await runDelivery();

  console.log(`\n=== Delivery result ===`);
  console.log(`Clients processed : ${summary.clientsProcessed}`);
  console.log(`Prospects delivered: ${summary.prospectsDelivered}`);
  if (summary.details.length > 0) {
    console.log('\nDetails:');
    for (const d of summary.details) console.log(`  ${d}`);
  }
  if (summary.errors.length > 0) {
    console.log('\nErrors:');
    for (const e of summary.errors) console.log(`  ${e}`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error('❌', (err as Error).message);
  await pool.end();
  process.exit(1);
});

#!/usr/bin/env tsx
import 'dotenv/config';
import { pool, query } from '../src/db.js';

const CLIENT = 'cd435b0e-6767-499f-99cd-c42a14a18a35';

async function main(): Promise<void> {
  const deliveryStatusCounts = await query(
    `SELECT status, count(*)::int AS n FROM deliveries GROUP BY status ORDER BY n DESC`
  );
  const recent = await query(
    `SELECT id, status, recipient_email, prospect_count, provider_message_id, error, emailed_at, created_at
     FROM deliveries ORDER BY created_at DESC LIMIT 15`
  );
  const deliveredNoEmail = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM prospects p
     WHERE p.status = 'delivered' AND p.client_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM deliveries d
         WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_sent'
       )`,
    [CLIENT]
  );
  const deliveredWithEmail = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM prospects p
     WHERE p.status = 'delivered' AND p.client_id = 'cd435b0e-6767-499f-99cd-c42a14a18a35'
       AND EXISTS (
         SELECT 1 FROM deliveries d
         WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_sent'
       )`
  );
  const sample = await query(
    `SELECT p.id, p.name, p.delivered_at, d.status AS delivery_status, d.emailed_at, d.provider_message_id, d.error, d.recipient_email
     FROM prospects p
     LEFT JOIN deliveries d ON p.id = ANY(d.prospect_ids)
     WHERE p.client_id = $1 AND p.status = 'delivered'
     ORDER BY p.delivered_at DESC NULLS LAST
     LIMIT 8`,
    [CLIENT]
  );
  const emailFailedDeliveries = await query(
    `SELECT id, recipient_email, prospect_count, error, created_at FROM deliveries
     WHERE status = 'email_failed' ORDER BY created_at DESC LIMIT 10`
  );

  const deliveredOnlyInFailed = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM prospects p
     WHERE p.client_id = $1 AND p.status = 'delivered'
       AND EXISTS (SELECT 1 FROM deliveries d WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_failed')
       AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE p.id = ANY(d.prospect_ids) AND d.status = 'email_sent')`,
    [CLIENT]
  );

  const deliveredNoLedger = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM prospects p
     WHERE p.client_id = $1 AND p.status = 'delivered'
       AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE p.id = ANY(d.prospect_ids))`,
    [CLIENT]
  );

  const byDeliveredAt = await query(
    `SELECT date_trunc('hour', delivered_at) AS hour, count(*)::int AS n
     FROM prospects WHERE client_id = $1 AND status = 'delivered' AND delivered_at IS NOT NULL
     GROUP BY 1 ORDER BY 1 DESC LIMIT 10`,
    [CLIENT]
  );

  const readyNow = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM prospects WHERE client_id = $1 AND status = 'personalized_qa_passed'`,
    [CLIENT]
  );

  console.log(JSON.stringify({
    delivery_status_counts: deliveryStatusCounts,
    recent_deliveries: recent,
    delivered_prospects_without_email_sent: deliveredNoEmail[0]?.n ?? 0,
    delivered_prospects_with_email_sent: deliveredWithEmail[0]?.n ?? 0,
    delivered_only_in_failed_batches: deliveredOnlyInFailed[0]?.n ?? 0,
    delivered_with_no_ledger_row: deliveredNoLedger[0]?.n ?? 0,
    ready_for_delivery_now: readyNow[0]?.n ?? 0,
    delivered_by_hour: byDeliveredAt,
    sample_delivered_prospects: sample,
    email_failed_deliveries: emailFailedDeliveries,
  }, null, 2));
  await pool.end();
}

void main();

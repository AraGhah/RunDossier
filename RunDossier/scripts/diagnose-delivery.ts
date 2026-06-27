#!/usr/bin/env tsx
import 'dotenv/config';
import { pool, query } from '../src/db.js';
import { config } from '../src/config.js';
import { deliveryEmailConfigured, sendDeliveryEmail } from '../src/utils/send-delivery-email.js';
import { resendConfigured } from '../src/utils/resend.js';
import { gmailConfigured } from '../src/utils/gmail-smtp.js';
import { isValidEmail } from '../src/utils/resend.js';
import { shouldDeliverParentBatch } from '../src/utils/batch-progress.js';
import { getParentBatchProgress } from '../src/services/parent-batch.js';
import { shouldRunDelivery } from '../src/utils/delivery-trigger.js';
import { getPipelineCounts } from '../src/services/workflow-run.js';

async function main(): Promise<void> {
  const clients = await query<{
    id: string;
    name: string;
    contact_email: string | null;
    client_first_name: string | null;
  }>(`SELECT id, name, contact_email, client_first_name FROM clients ORDER BY created_at`);

  const statusCounts = await query<{ status: string; n: string }>(
    `SELECT status, count(*)::text AS n FROM prospects GROUP BY status ORDER BY count(*) DESC`
  );

  const readyByClient = await query<{ client_id: string; n: string }>(
    `SELECT client_id, count(*)::text AS n FROM prospects
     WHERE status = 'personalized_qa_passed' GROUP BY client_id`
  );

  const delivering = await query<{ id: string; name: string; client_id: string; parent_batch_id: string | null }>(
    `SELECT id, name, client_id, parent_batch_id FROM prospects WHERE status = 'delivering' LIMIT 20`
  );

  const parentBatches = await query(
    `SELECT id, client_id, status, requested_prospect_count, imported_count, delivered_count,
            source_exhausted, delivery_id, error_message, created_at, updated_at
     FROM parent_batches ORDER BY created_at DESC LIMIT 10`
  );

  const deliveries = await query(
    `SELECT id, client_id, status, recipient_email, prospect_count, filename, file_path,
            provider_message_id, error, attempts, emailed_at, created_at
     FROM deliveries ORDER BY created_at DESC LIMIT 15`
  );

  const deliveryEvents = await query(
    `SELECT id, delivery_id, client_id, event_type, status, error, created_at
     FROM delivery_events ORDER BY created_at DESC LIMIT 20`
  ).catch(() => []);

  const failedJobs = await query(
    `SELECT id, workflow, entity_id, error, retry_count, created_at
     FROM failed_jobs WHERE workflow ILIKE '%deliver%' OR error ILIKE '%deliver%' OR error ILIKE '%email%'
     ORDER BY created_at DESC LIMIT 20`
  );

  const activeParent = await query<{ client_id: string; id: string; status: string }>(
    `SELECT client_id, id, status FROM parent_batches
     WHERE status IN ('queued','processing','delivering','stalled')`
  );

  const pipeline = await getPipelineCounts().catch(() => null);

  const gateChecks: Record<string, unknown> = {};
  for (const c of clients) {
    const ready = Number(readyByClient.find((r) => r.client_id === c.id)?.n ?? 0);
    const pending = pipeline
      ? Object.entries(pipeline).reduce((acc, [k, v]) => {
          if (['research_in_progress', 'personalization_in_progress', 'queued'].includes(k)) acc += Number(v);
          return acc;
        }, 0)
      : null;
    gateChecks[c.id] = {
      name: c.name,
      contact_email: c.contact_email,
      contact_valid: isValidEmail(c.contact_email),
      ready_qa_passed: ready,
      should_run_delivery_legacy: shouldRunDelivery({ pendingPipelineCount: pending ?? 0, readyCount: ready }),
      blocked_by_active_parent: activeParent.some((p) => p.client_id === c.id),
    };
  }

  for (const pb of parentBatches as Array<{ id: string }>) {
    const progress = await getParentBatchProgress(pb.id);
    (pb as Record<string, unknown>).should_deliver = progress ? shouldDeliverParentBatch(progress) : false;
    (pb as Record<string, unknown>).progress = progress;
  }

  console.log(JSON.stringify({
    email_config: {
      provider_pref: config.deliveryEmailProvider,
      resend_configured: resendConfigured(),
      gmail_configured: gmailConfigured(),
      any_provider: deliveryEmailConfigured(),
      delivery_csv_only: config.deliveryCsvOnly,
      delivery_from: config.deliveryFromEmail ? `${config.deliveryFromEmail.slice(0, 3)}…` : null,
      gmail_user: config.gmailUser ? `${config.gmailUser.slice(0, 3)}…` : null,
      delivery_test_to: config.deliveryTestTo || null,
      gmail_delivery_to: config.gmailDeliveryTo || null,
    },
    clients,
    prospect_status_counts: statusCounts,
    ready_by_client: readyByClient,
    stuck_delivering: delivering,
    parent_batches: parentBatches,
    deliveries,
    delivery_events: deliveryEvents,
    failed_jobs_delivery: failedJobs,
    gate_checks: gateChecks,
  }, null, 2));

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

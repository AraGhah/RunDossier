import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query, queryOne } from '../db.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { buildDeliveryCsv, isInternalEmail, formatResearchSignals, extractCompanyDomain, type DeliveryRow } from '../utils/csv-delivery.js';
import { buildDeliveryEmailContent, type DeliveryEmailStats } from '../utils/delivery-email.js';
import { isValidEmail } from '../utils/resend.js';
import { sendDeliveryEmail, type SendDeliveryEmailResult } from '../utils/send-delivery-email.js';
import { BEST_SHIPPED_LINE_LATERAL } from '../utils/first-line-status.js';
import { recordDeliveryEvent } from '../utils/delivery-events.js';
import { countThinResearch, getPipelineCounts, getLatestWorkflowRunId } from '../services/workflow-run.js';

interface ClientRow {
  id: string;
  name: string;
  contact_email: string | null;
  client_first_name: string | null;
}

export interface DeliveryRunSummary {
  clientsProcessed: number;
  prospectsDelivered: number;
  details: string[];
  errors: string[];
}

export type DeliveryAction = 'internal_only' | 'no_recipient' | 'send';

export type DeliveryLedgerStatus =
  | 'delivery_ready'
  | 'email_sent'
  | 'email_failed'
  | 'skipped_no_recipient'
  | 'skipped_internal_only'
  | 'skipped_not_configured';

/**
 * Decide what to do with a claimed batch — pure so it can be unit-tested.
 * Internal-only batches never email; a batch with deliverable rows needs a
 * valid recipient before we attempt a send.
 */
export function planDelivery(opts: {
  deliverableCount: number;
  internalCount: number;
  hasRecipient: boolean;
}): { action: DeliveryAction } {
  if (opts.deliverableCount === 0) return { action: 'internal_only' };
  if (!opts.hasRecipient) return { action: 'no_recipient' };
  return { action: 'send' };
}

/**
 * Map a provider send result onto a ledger status + whether to finalize the
 * prospects as delivered — pure so it can be unit-tested. A genuine failure
 * does NOT finalize, so the rows are retried on the next cycle (no silent loss);
 * a "not configured" skip finalizes to preserve the CSV-only delivery mode.
 */
export function resolveSendOutcome(
  result: Pick<SendDeliveryEmailResult, 'ok' | 'skipped'>,
  opts?: { csvOnly?: boolean }
): {
  finalize: boolean;
  deliveryStatus: Extract<DeliveryLedgerStatus, 'email_sent' | 'email_failed' | 'skipped_not_configured'>;
} {
  if (result.ok) return { finalize: true, deliveryStatus: 'email_sent' };
  if (result.skipped) {
    if (opts?.csvOnly) {
      return { finalize: true, deliveryStatus: 'skipped_not_configured' };
    }
    return { finalize: false, deliveryStatus: 'email_failed' };
  }
  return { finalize: false, deliveryStatus: 'email_failed' };
}

let resolvedDeliveryDir: string | null = null;

async function ensureDeliveryDir(): Promise<string> {
  if (resolvedDeliveryDir) return resolvedDeliveryDir;

  const candidates = [
    config.deliveryDir,
    join(tmpdir(), 'dossier-deliveries'),
    'data/deliveries',
  ];

  for (const dir of [...new Set(candidates)]) {
    try {
      await mkdir(dir, { recursive: true });
      resolvedDeliveryDir = dir;
      return dir;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EACCES' || code === 'EROFS') continue;
      throw err;
    }
  }

  throw new Error('No writable delivery directory (set DELIVERY_DIR to a writable path)');
}

function averageFitScore(rows: DeliveryRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + (row.confidence_score ?? 0), 0);
  return Math.round(sum / rows.length);
}

/** Hand claimed rows back to the ready pool so the next cycle can retry them. */
async function releaseClaim(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await query(
    `UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW()
     WHERE id = ANY($1::uuid[]) AND status = 'delivering'`,
    [ids]
  );
}

async function markDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await query(
    `UPDATE prospects SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
     WHERE id = ANY($1::uuid[]) AND status = 'delivering'`,
    [ids]
  );
}

async function markBatchesDelivered(clientId: string): Promise<void> {
  await query(
    `UPDATE batches SET status = 'delivered'
     WHERE client_id = $1 AND status IN ('queued', 'processing')`,
    [clientId]
  );
}

interface DeliveryLedgerUpdate {
  status: DeliveryLedgerStatus;
  filename?: string | null;
  filePath?: string | null;
  providerMessageId?: string | null;
  error?: string | null;
  emailedAt?: boolean;
}

async function updateDelivery(id: string | null, fields: DeliveryLedgerUpdate): Promise<void> {
  if (!id) return;
  await query(
    `UPDATE deliveries
        SET status = $2,
            filename = COALESCE($3, filename),
            file_path = COALESCE($4, file_path),
            provider_message_id = COALESCE($5, provider_message_id),
            error = $6,
            emailed_at = CASE WHEN $7 THEN NOW() ELSE emailed_at END
      WHERE id = $1`,
    [
      id,
      fields.status,
      fields.filename ?? null,
      fields.filePath ?? null,
      fields.providerMessageId ?? null,
      fields.error ?? null,
      fields.emailedAt ?? false,
    ]
  ).catch(e => console.error('[delivery] ledger update error:', e));
}

async function logDeliveryFailure(clientId: string, message: string): Promise<void> {
  await query(
    `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
     VALUES ('delivery', $1, $2, 0)`,
    [clientId, message.slice(0, 500)]
  ).catch(e => console.error('[delivery] failed_jobs insert error:', e));
}

/**
 * Build the CSV, email it to the client, and finalize statuses for a batch of
 * prospects that have already been atomically claimed (status 'delivering').
 * Returns the number of prospects considered delivered.
 */
async function deliverClaimedBatch(client: ClientRow, claimedIds: string[]): Promise<number> {
  const generatedAt = new Date().toISOString();
  const prospects = await query<{
    id: string;
    name: string;
    title: string | null;
    company: string | null;
    email: string | null;
    linkedin_url: string | null;
    confidence_score: number | null;
    research_summary: string | null;
    top_3_signals: unknown;
    status: string;
    batch_id: string | null;
    subject: string;
    opener: string;
    bridge: string;
    variant_number: number;
  }>(
    `SELECT p.id, p.name, p.title, p.company, p.email, p.linkedin_url,
            p.confidence_score, p.research_summary, p.top_3_signals, p.status, p.batch_id,
            fl.subject, fl.opener, fl.bridge, fl.variant_number
     FROM prospects p
     ${BEST_SHIPPED_LINE_LATERAL}
     WHERE p.id = ANY($1::uuid[])`,
    [claimedIds]
  );

  // A claimed prospect missing a shipped first_line is dropped by the lateral
  // join — release it so it never strands in 'delivering'.
  const fetchedIds = new Set(prospects.map(p => p.id));
  const missingLineIds = claimedIds.filter(id => !fetchedIds.has(id));
  if (missingLineIds.length > 0) await releaseClaim(missingLineIds);

  if (prospects.length === 0) return 0;

  const deliveryIdPlaceholder = '';
  const workflowRunId = await getLatestWorkflowRunId();

  const rows = prospects.map((p) => {
    const { text: researchSignals, sources: sourceLinks } = formatResearchSignals(p.top_3_signals);
    return {
      id: p.id,
      row: {
        client_name: client.name,
        prospect_name: p.name,
        title: p.title ?? '',
        company: p.company ?? '',
        company_domain: extractCompanyDomain(p.email, p.company ?? ''),
        linkedin_url: p.linkedin_url ?? '',
        email: p.email ?? '',
        research_signals: researchSignals,
        source_links: sourceLinks,
        research_summary: p.research_summary ?? '',
        confidence_score: p.confidence_score ?? 0,
        subject: p.subject,
        opener: p.opener,
        bridge: p.bridge,
        variant_number: p.variant_number ?? 1,
        prospect_status: p.status,
        batch_id: p.batch_id ?? '',
        delivery_id: deliveryIdPlaceholder,
        run_id: workflowRunId,
        generated_at: generatedAt,
      } satisfies DeliveryRow,
    };
  });

  const deliverableEntries = rows.filter(entry => !isInternalEmail(entry.row.email));
  const deliverable = deliverableEntries.map(entry => entry.row);
  const internalOnlyIds = rows
    .filter(entry => isInternalEmail(entry.row.email))
    .map(entry => entry.id);
  const allIds = rows.map(r => r.id);
  const avgFit = averageFitScore(deliverable);

  const hasRecipient = isValidEmail(client.contact_email);
  const decision = planDelivery({
    deliverableCount: deliverable.length,
    internalCount: internalOnlyIds.length,
    hasRecipient,
  });

  // Open a durable ledger row for this attempt (delivery_ready).
  const ledger = await queryOne<{ id: string }>(
    `INSERT INTO deliveries
       (client_id, status, recipient_email, prospect_count, avg_fit_score, prospect_ids, attempts)
     VALUES ($1, 'delivery_ready', $2, $3, $4, $5::uuid[], 1)
     RETURNING id`,
    [
      client.id,
      client.contact_email ?? null,
      deliverable.length,
      deliverable.length > 0 ? avgFit : null,
      allIds,
    ]
  ).catch(e => {
    console.error('[delivery] ledger insert error:', e);
    return null;
  });
  const deliveryId = ledger?.id ?? null;

  for (const entry of rows) {
    entry.row.delivery_id = deliveryId ?? '';
  }

  await recordDeliveryEvent({
    deliveryId,
    clientId: client.id,
    eventType: 'created',
    status: 'delivery_ready',
    metadata: {
      prospect_count: deliverable.length,
      internal_excluded: internalOnlyIds.length,
      avg_fit_score: avgFit,
    },
  });

  // Audit: flag as a retry if a previous delivery for this client ended in failure.
  const priorFailures = await query<{ n: string }>(
    `SELECT count(*)::text AS n FROM deliveries
     WHERE client_id = $1 AND status IN ('email_failed', 'skipped_no_recipient')`,
    [client.id]
  ).catch(() => [] as { n: string }[]);
  if (Number(priorFailures[0]?.n ?? 0) > 0) {
    await recordDeliveryEvent({
      deliveryId,
      clientId: client.id,
      eventType: 'retried',
      status: 'delivery_ready',
    });
  }

  // All recipients internal → mark delivered, no email.
  if (decision.action === 'internal_only') {
    await markDelivered(allIds);
    await markBatchesDelivered(client.id);
    await updateDelivery(deliveryId, { status: 'skipped_internal_only' });
    await recordDeliveryEvent({
      deliveryId,
      clientId: client.id,
      eventType: 'skipped',
      status: 'skipped_internal_only',
      metadata: { internal_only: allIds.length },
    });
    await notify(
      `W5 Livraison — ${client.name}\n` +
        `• ${allIds.length} prospect(s) marqués livrés (emails internes uniquement, CSV non envoyé)`
    );
    return allIds.length;
  }

  // CSV body lives in memory and is what we attach — disk archiving is best-effort.
  const csv = buildDeliveryCsv(deliverable);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Dossier Delivery - ${date} - ${client.name.replace(/[^\w.-]+/g, '_')}.csv`;

  let filePath: string | null = null;
  try {
    const deliveryDir = await ensureDeliveryDir();
    filePath = join(deliveryDir, filename);
    await writeFile(filePath, csv, 'utf8');
  } catch (err) {
    filePath = null;
    console.error('[delivery] CSV archive write failed (continuing):', (err as Error).message);
  }

  // No valid client email → don't attempt a send; hand rows back for retry.
  if (decision.action === 'no_recipient') {
    await releaseClaim(allIds);
    await updateDelivery(deliveryId, {
      status: 'skipped_no_recipient',
      filename,
      filePath,
      error: `client ${client.id} has no valid contact_email`,
    });
    await logDeliveryFailure(client.id, `missing/invalid recipient for client ${client.name}`);
    await recordDeliveryEvent({
      deliveryId,
      clientId: client.id,
      eventType: 'skipped',
      status: 'skipped_no_recipient',
      error: `client ${client.id} has no valid contact_email`,
    });
    await notify(
      `W5 Livraison — ${client.name}\n` +
        `• ${deliverable.length} prospect(s) prêts mais aucun email client valide — non envoyé (en attente)`
    );
    return 0;
  }

  // Send.
  const thinExcluded = await countThinResearch();
  const pipelineCounts = await getPipelineCounts();
  const emailStats: DeliveryEmailStats = {
    delivered: deliverable.length,
    thinResearchExcluded: thinExcluded,
    qaFailed: pipelineCounts.qa_failed ?? 0,
    researchFailed: pipelineCounts.research_failed ?? 0,
    deliveryId: deliveryId ?? undefined,
  };

  const { subject, html, text } = buildDeliveryEmailContent(
    client.client_first_name,
    deliverable.length,
    deliverable,
    filename,
    emailStats
  );
  const result = await sendDeliveryEmail({
    to: client.contact_email as string,
    subject,
    html,
    text,
    replyTo: config.deliveryReplyTo || undefined,
    attachments: [{ filename, content: Buffer.from(csv, 'utf8') }],
  });

  const outcome = resolveSendOutcome(result, { csvOnly: config.deliveryCsvOnly });

  if (outcome.finalize) {
    await markDelivered(allIds);
    await markBatchesDelivered(client.id);
    await updateDelivery(deliveryId, {
      status: outcome.deliveryStatus,
      filename,
      filePath,
      providerMessageId: result.id ?? null,
      emailedAt: result.ok,
      error: result.ok ? null : result.error ?? null,
    });
    await recordDeliveryEvent({
      deliveryId,
      clientId: client.id,
      eventType: result.ok ? 'emailed' : 'skipped',
      status: outcome.deliveryStatus,
      metadata: {
        recipient: client.contact_email,
        prospect_count: deliverable.length,
        provider_message_id: result.id ?? null,
        provider: result.provider ?? null,
      },
      error: result.ok ? null : result.error ?? null,
    });
  } else {
    await releaseClaim(allIds);
    await updateDelivery(deliveryId, {
      status: 'email_failed',
      filename,
      filePath,
      error: result.error ?? 'unknown send error',
    });
    await logDeliveryFailure(client.id, result.error ?? 'email send failed');
    await recordDeliveryEvent({
      deliveryId,
      clientId: client.id,
      eventType: 'failed',
      status: 'email_failed',
      metadata: { recipient: client.contact_email, prospect_count: deliverable.length },
      error: result.error ?? 'unknown send error',
    });
  }

  const emailStatus =
    outcome.deliveryStatus === 'email_sent'
      ? `email envoyé (${result.provider ?? 'provider'})`
      : outcome.deliveryStatus === 'skipped_not_configured'
        ? 'aucun provider email configuré — CSV seulement'
        : 'email échoué — retry au prochain cycle';

  await notify(
    `W5 Livraison — ${client.name}\n` +
      `• ${deliverable.length} prospect(s) exportés` +
      (internalOnlyIds.length > 0 ? ` (${internalOnlyIds.length} interne(s) exclus)` : '') +
      `\n• Score fit moyen: ${avgFit}/100` +
      (filePath ? `\n• Fichier: ${filePath}` : `\n• Fichier: (archive locale indisponible)`) +
      `\n• Destinataire: ${client.contact_email} (${emailStatus})`
  );

  return outcome.finalize ? deliverable.length : 0;
}

export async function runDeliveryForClient(
  clientId: string,
  opts?: { limit?: number }
): Promise<number> {
  const client = await queryOne<ClientRow>(
    `SELECT id, name, contact_email, client_first_name FROM clients WHERE id = $1`,
    [clientId]
  );
  if (!client) {
    console.warn('[delivery] unknown client:', clientId);
    return 0;
  }

  const claimed = opts?.limit
    ? await query<{ id: string }>(
        `UPDATE prospects
            SET status = 'delivering', updated_at = NOW()
          WHERE id IN (
            SELECT id FROM prospects
            WHERE client_id = $1 AND status = 'personalized_qa_passed'
            ORDER BY confidence_score DESC NULLS LAST, updated_at
            LIMIT $2
          )
          RETURNING id`,
        [clientId, opts.limit]
      )
    : await query<{ id: string }>(
        `UPDATE prospects
            SET status = 'delivering', updated_at = NOW()
          WHERE client_id = $1 AND status = 'personalized_qa_passed'
          RETURNING id`,
        [clientId]
      );
  if (claimed.length === 0) return 0;

  const claimedIds = claimed.map(r => r.id);

  try {
    return await deliverClaimedBatch(client, claimedIds);
  } catch (err) {
    // Never strand a claim — release it and log so the next cycle retries.
    console.error('[delivery] batch error, releasing claim:', clientId, err);
    await releaseClaim(claimedIds).catch(e => console.error('[delivery] release error:', e));
    await logDeliveryFailure(client.id, (err as Error).message);
    return 0;
  }
}

export async function runDelivery(): Promise<DeliveryRunSummary> {
  const summary: DeliveryRunSummary = {
    clientsProcessed: 0,
    prospectsDelivered: 0,
    details: [],
    errors: [],
  };

  const clients = await query<{ client_id: string }>(
    `SELECT DISTINCT client_id
     FROM prospects
     WHERE status = 'personalized_qa_passed' AND client_id IS NOT NULL`
  );

  for (const { client_id } of clients) {
    try {
      const [client] = await query<{ name: string }>(
        `SELECT name FROM clients WHERE id = $1`,
        [client_id]
      );
      const count = await runDeliveryForClient(client_id);
      if (count > 0) {
        summary.clientsProcessed += 1;
        summary.prospectsDelivered += count;
        summary.details.push(`${client?.name ?? client_id}: ${count} livré(s)`);
      }
    } catch (err) {
      const message = (err as Error).message;
      console.error('[delivery] client error:', client_id, err);
      summary.errors.push(`${client_id}: ${message}`);
    }
  }

  return summary;
}

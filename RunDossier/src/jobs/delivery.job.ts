import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query } from '../db.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { buildDeliveryCsv, isInternalEmail, type DeliveryRow } from '../utils/csv-delivery.js';
import { buildDeliveryEmailContent } from '../utils/delivery-email.js';
import { resendConfigured, sendResendEmail } from '../utils/resend.js';
import { BEST_SHIPPED_LINE_LATERAL } from '../utils/first-line-status.js';

interface ClientRow {
  id: string;
  name: string;
  contact_email: string;
  client_first_name: string | null;
}

export interface DeliveryRunSummary {
  clientsProcessed: number;
  prospectsDelivered: number;
  details: string[];
  errors: string[];
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

async function sendDeliveryEmail(
  to: string,
  clientFirstName: string | null,
  deliverable: DeliveryRow[],
  csvBody: string,
  filename: string
): Promise<boolean> {
  const { subject, html, text } = buildDeliveryEmailContent(
    clientFirstName,
    deliverable.length,
    deliverable,
    filename
  );

  return sendResendEmail({
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename,
        content: Buffer.from(csvBody, 'utf8').toString('base64'),
      },
    ],
  });
}

function averageFitScore(rows: DeliveryRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + (row.fit_score ?? 0), 0);
  return Math.round(sum / rows.length);
}

export async function runDeliveryForClient(clientId: string): Promise<number> {
  const [client] = await query<ClientRow>(
    `SELECT id, name, contact_email, client_first_name FROM clients WHERE id = $1`,
    [clientId]
  );
  if (!client) {
    console.warn('[delivery] unknown client:', clientId);
    return 0;
  }

  const prospects = await query<{
    id: string;
    name: string;
    title: string | null;
    company: string | null;
    email: string | null;
    confidence_score: number | null;
    subject: string;
    opener: string;
    bridge: string;
  }>(
    `SELECT p.id, p.name, p.title, p.company, p.email, p.confidence_score,
            fl.subject, fl.opener, fl.bridge
     FROM prospects p
     ${BEST_SHIPPED_LINE_LATERAL}
     WHERE p.client_id = $1 AND p.status = 'personalized_qa_passed'`,
    [clientId]
  );

  if (prospects.length === 0) return 0;

  const rows = prospects.map(p => ({
    id: p.id,
    row: {
      name: p.name,
      title: p.title ?? '',
      company: p.company ?? '',
      email: p.email ?? '',
      subject: p.subject,
      opener: p.opener,
      bridge: p.bridge,
      fit_score: p.confidence_score ?? 0,
    } satisfies DeliveryRow,
  }));

  const deliverableEntries = rows.filter(entry => !isInternalEmail(entry.row.email));
  const deliverable = deliverableEntries.map(entry => entry.row);
  const deliverableIds = deliverableEntries.map(entry => entry.id);
  const internalOnlyIds = rows
    .filter(entry => isInternalEmail(entry.row.email))
    .map(entry => entry.id);

  if (deliverable.length === 0) {
    await query(
      `UPDATE prospects SET status = 'delivered', delivered_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [rows.map(r => r.id)]
    );
    await notify(
      `W5 Livraison — ${client.name}\n` +
        `• ${rows.length} prospect(s) marqués livrés (emails internes uniquement, CSV non envoyé)`
    );
    return rows.length;
  }

  const csv = buildDeliveryCsv(deliverable);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Dossier Delivery - ${date} - ${client.name.replace(/[^\w.-]+/g, '_')}.csv`;

  const deliveryDir = await ensureDeliveryDir();
  const filePath = join(deliveryDir, filename);
  await writeFile(filePath, csv, 'utf8');

  const emailed = await sendDeliveryEmail(
    client.contact_email,
    client.client_first_name,
    deliverable,
    csv,
    filename
  );

  const canFinalize = emailed || !resendConfigured();
  if (canFinalize) {
    const idsToDeliver = [...deliverableIds, ...internalOnlyIds];
    await query(
      `UPDATE prospects SET status = 'delivered', delivered_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [idsToDeliver]
    );

    await query(
      `UPDATE batches SET status = 'delivered'
       WHERE client_id = $1 AND status IN ('queued', 'processing')`,
      [clientId]
    );
  }

  const avgFit = averageFitScore(deliverable);
  const emailStatus = emailed
    ? 'email envoyé'
    : resendConfigured()
      ? 'email échoué — retry au prochain cycle'
      : 'Resend non configuré — CSV seulement';

  await notify(
    `W5 Livraison — ${client.name}\n` +
      `• ${deliverable.length} prospect(s) exportés` +
      (internalOnlyIds.length > 0 ? ` (${internalOnlyIds.length} interne(s) exclus)` : '') +
      `\n• Score fit moyen: ${avgFit}/100\n` +
      `• Fichier: ${filePath}\n` +
      `• Destinataire: ${client.contact_email} (${emailStatus})`
  );

  return canFinalize ? deliverable.length : 0;
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

import { mkdir, writeFile } from 'node:fs/promises';
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
    await notify(`Delivery skipped for ${client.name}: all rows filtered (internal emails) — prospects marked delivered`);
    return 0;
  }

  const csv = buildDeliveryCsv(deliverable);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Dossier Delivery - ${date} - ${client.name.replace(/[^\w.-]+/g, '_')}.csv`;

  await mkdir(config.deliveryDir, { recursive: true });
  const filePath = join(config.deliveryDir, filename);
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

  await notify(
    `W5 Delivery: ${client.name}\n${deliverable.length} prospect(s)\nFile: ${filePath}\nEmail: ${client.contact_email}${
      emailed
        ? ''
        : resendConfigured()
          ? '\n(Email failed — prospects left in personalized_qa_passed for retry)'
          : '\n(Resend not configured — CSV saved only)'
    }`
  );

  return canFinalize ? deliverable.length : 0;
}

export async function runDelivery(): Promise<void> {
  const clients = await query<{ client_id: string }>(
    `SELECT DISTINCT client_id
     FROM prospects
     WHERE status = 'personalized_qa_passed' AND client_id IS NOT NULL`
  );

  for (const { client_id } of clients) {
    try {
      await runDeliveryForClient(client_id);
    } catch (err) {
      console.error('[delivery] client error:', client_id, err);
      await notify(`Delivery failed for client ${client_id}: ${(err as Error).message}`);
    }
  }
}

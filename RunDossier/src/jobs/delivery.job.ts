import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { query } from '../db.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { buildDeliveryCsv, filterDeliveryRows, type DeliveryRow } from '../utils/csv-delivery.js';

interface ClientRow {
  id: string;
  name: string;
  contact_email: string;
  client_first_name: string | null;
}

async function sendDeliveryEmail(
  to: string,
  clientName: string,
  rowCount: number,
  csvBody: string,
  filename: string
): Promise<void> {
  if (!config.resendApiKey || !config.deliveryFromEmail) return;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.deliveryFromEmail,
      to: [to],
      subject: `Dossier delivery — ${rowCount} prospect${rowCount === 1 ? '' : 's'}`,
      text: `Hi,\n\nYour Dossier batch for ${clientName} is ready (${rowCount} prospects).\n\nThe CSV is attached.\n\n— Dossier / Preframe`,
      attachments: [
        {
          filename,
          content: Buffer.from(csvBody, 'utf8').toString('base64'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[delivery] Resend error:', res.status, body.slice(0, 300));
  }
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
     JOIN first_lines fl ON fl.prospect_id = p.id AND fl.is_chosen = true
     WHERE p.client_id = $1 AND p.status = 'personalized_qa_passed'`,
    [clientId]
  );

  if (prospects.length === 0) return 0;

  const rows: DeliveryRow[] = prospects.map(p => ({
    name: p.name,
    title: p.title ?? '',
    company: p.company ?? '',
    email: p.email ?? '',
    subject: p.subject,
    opener: p.opener,
    bridge: p.bridge,
    fit_score: p.confidence_score ?? 0,
  }));

  const deliverable = filterDeliveryRows(rows);
  if (deliverable.length === 0) {
    await notify(`Delivery skipped for ${client.name}: all rows filtered (internal emails)`);
    return 0;
  }

  const csv = buildDeliveryCsv(deliverable);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Dossier Delivery - ${date} - ${client.name.replace(/[^\w.-]+/g, '_')}.csv`;

  await mkdir(config.deliveryDir, { recursive: true });
  const filePath = join(config.deliveryDir, filename);
  await writeFile(filePath, csv, 'utf8');

  const prospectIds = prospects.map(p => p.id);
  await query(
    `UPDATE prospects SET status = 'delivered', delivered_at = NOW()
     WHERE id = ANY($1::uuid[])`,
    [prospectIds]
  );

  await query(
    `UPDATE batches SET status = 'delivered'
     WHERE client_id = $1 AND status IN ('queued', 'processing')`,
    [clientId]
  );

  await sendDeliveryEmail(client.contact_email, client.name, deliverable.length, csv, filename);

  await notify(
    `W5 Delivery: ${client.name}\n${deliverable.length} prospect(s)\nFile: ${filePath}\nEmail: ${client.contact_email}`
  );

  return deliverable.length;
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

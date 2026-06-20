/**
 * Test W5 delivery email with full CSV (Resend sandbox fallback + Gmail).
 * Usage: npx tsx scripts/test-delivery-email.ts [recipient@email.com]
 */
import 'dotenv/config';
import { queryOne, pool } from '../src/db.js';
import { config } from '../src/config.js';
import { buildDeliveryCsv, type DeliveryRow } from '../src/utils/csv-delivery.js';
import { buildDeliveryEmailContent } from '../src/utils/delivery-email.js';
import { sendDeliveryEmail, deliveryEmailConfigured } from '../src/utils/send-delivery-email.js';
import { isValidEmail } from '../src/utils/resend.js';

async function resolveRecipient(cliArg?: string): Promise<string> {
  if (cliArg && isValidEmail(cliArg)) return cliArg;
  if (config.deliveryTestTo && isValidEmail(config.deliveryTestTo)) return config.deliveryTestTo;
  if (config.gmailDeliveryTo && isValidEmail(config.gmailDeliveryTo)) return config.gmailDeliveryTo;
  const client = await queryOne<{ contact_email: string }>(
    `SELECT contact_email FROM clients WHERE contact_email IS NOT NULL LIMIT 1`
  );
  if (client?.contact_email && isValidEmail(client.contact_email)) return client.contact_email;
  throw new Error(
    'No valid recipient. Pass an email arg or set DELIVERY_TEST_TO / GMAIL_DELIVERY_TO / clients.contact_email'
  );
}

function sampleRows(): DeliveryRow[] {
  const ts = new Date().toISOString();
  return [
    {
      client_name: 'Test Client',
      prospect_name: 'Jane Doe',
      title: 'VP Sales',
      company: 'Acme Corp',
      company_domain: 'acme.com',
      linkedin_url: 'https://www.linkedin.com/in/janedoe',
      email: 'jane@acme.com',
      research_signals: 'Series B funding March 2025 | Hiring SDR managers',
      source_links: 'https://techcrunch.com/example | https://linkedin.com/jobs/1',
      research_summary: 'Recent funding and outbound hiring indicate pipeline investment.',
      confidence_score: 88,
      subject: 'quick note on the SDR hires',
      opener: 'Saw Acme is hiring three SDR managers this quarter.',
      bridge: 'We help teams turn new outbound hires into booked meetings faster.',
      variant_number: 1,
      prospect_status: 'personalized_qa_passed',
      batch_id: 'test-batch',
      delivery_id: 'test-delivery',
      run_id: 'test-run',
      generated_at: ts,
    },
  ];
}

async function main(): Promise<void> {
  if (!deliveryEmailConfigured()) {
    throw new Error('No email provider configured (RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD)');
  }

  const to = await resolveRecipient(process.argv[2]);
  const rows = sampleRows();
  const filename = `Dossier Delivery - TEST - ${new Date().toISOString().slice(0, 10)}.csv`;
  const csv = buildDeliveryCsv(rows);

  if (!csv.includes('run_id') || csv.split('\n').length < 2) {
    throw new Error('CSV generation failed validation');
  }

  const { subject, html, text } = buildDeliveryEmailContent(
    'Test',
    rows.length,
    rows,
    filename,
    { delivered: 1, thinResearchExcluded: 0, deliveryId: 'test-delivery' }
  );

  console.log(`Sending test delivery to: ${to}`);
  console.log(`Providers: resend=${Boolean(config.resendApiKey)}, gmail=${Boolean(config.gmailUser)}`);

  const result = await sendDeliveryEmail({
    to,
    subject: `[TEST] ${subject}`,
    html,
    text,
    replyTo: config.deliveryReplyTo || undefined,
    attachments: [{ filename, content: Buffer.from(csv, 'utf8') }],
  });

  if (!result.ok) {
    throw new Error(result.error ?? 'email send failed');
  }

  console.log(`✅ Email sent via ${result.provider ?? 'unknown'} (id: ${result.id ?? 'n/a'})`);
  console.log(`✅ CSV attachment: ${filename} (${csv.length} bytes, ${csv.split('\n')[0].split(',').length} columns)`);
  await pool.end();
}

void main().catch(async (err) => {
  console.error('❌', (err as Error).message);
  await pool.end();
  process.exit(1);
});

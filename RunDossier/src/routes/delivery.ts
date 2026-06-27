import type { Express } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { sendInternalError } from '../utils/safe-error.js';
import { config } from '../config.js';
import { countMisdeliveredProspects, repairMisdeliveredProspects } from '../services/delivery-repair.js';
import { runDeliveryForClient } from '../jobs/delivery.job.js';
import { deliveryEmailConfigured, sendDeliveryEmail } from '../utils/send-delivery-email.js';
import { buildDeliveryCsv, type DeliveryRow } from '../utils/csv-delivery.js';
import { buildDeliveryEmailContent } from '../utils/delivery-email.js';
import { isValidEmail } from '../utils/resend.js';
import { queryOne } from '../db.js';

function sampleTestRow(): DeliveryRow {
  const ts = new Date().toISOString();
  return {
    client_name: 'Test Client',
    prospect_name: 'Jane Doe',
    title: 'VP Sales',
    company: 'Acme Corp',
    company_domain: 'acme.com',
    linkedin_url: 'https://www.linkedin.com/in/janedoe',
    email: 'jane@acme.com',
    research_signals: 'Series B funding | Hiring SDRs',
    source_links: 'https://example.com',
    research_summary: 'Outbound hiring signal.',
    confidence_score: 88,
    subject: 'quick note',
    opener: 'Saw Acme is hiring SDR managers.',
    bridge: 'We help teams book meetings faster.',
    variant_number: 1,
    prospect_status: 'personalized_qa_passed',
    batch_id: 'test',
    delivery_id: 'test',
    run_id: 'test',
    generated_at: ts,
  };
}

export function registerDeliveryRoutes(app: Express): void {
  app.get('/api/delivery/status', requireAdmin, async (_req, res) => {
    try {
      const misdelivered = await countMisdeliveredProspects();
      res.json({
        email_provider_configured: deliveryEmailConfigured(),
        delivery_csv_only: config.deliveryCsvOnly,
        misdelivered_prospect_count: misdelivered,
      });
    } catch (err) {
      sendInternalError(res, _req, err, 'delivery_status_failed');
    }
  });

  app.post('/api/delivery/retry', requireAdmin, async (req, res) => {
    try {
      if (!deliveryEmailConfigured() && !config.deliveryCsvOnly) {
        res.status(503).json({ error: 'no_email_provider_configured' });
        return;
      }
      const clientId = typeof req.body?.client_id === 'string' ? req.body.client_id.trim() : undefined;
      const limit =
        typeof req.body?.limit === 'number' && req.body.limit > 0 ? Math.floor(req.body.limit) : undefined;

      const repair = await repairMisdeliveredProspects(clientId);
      let delivered = 0;
      for (const cid of repair.clientIds) {
        delivered += await runDeliveryForClient(cid, limit ? { limit } : undefined);
      }
      res.json({
        ok: true,
        reset_count: repair.resetCount,
        delivered_count: delivered,
        remaining_misdelivered: await countMisdeliveredProspects(clientId),
      });
    } catch (err) {
      sendInternalError(res, req, err, 'delivery_retry_failed');
    }
  });

  app.post('/api/delivery/test', requireAdmin, async (req, res) => {
    try {
      if (!deliveryEmailConfigured()) {
        res.status(503).json({ error: 'no_email_provider_configured' });
        return;
      }
      const toArg = typeof req.body?.to === 'string' ? req.body.to.trim() : undefined;
      const to =
        (toArg && isValidEmail(toArg) ? toArg : undefined) ??
        (config.deliveryTestTo && isValidEmail(config.deliveryTestTo) ? config.deliveryTestTo : undefined) ??
        (await queryOne<{ contact_email: string }>(
          `SELECT contact_email FROM clients WHERE contact_email IS NOT NULL LIMIT 1`
        ))?.contact_email;

      if (!to || !isValidEmail(to)) {
        res.status(400).json({ error: 'valid recipient required (body.to or DELIVERY_TEST_TO)' });
        return;
      }

      const rows = [sampleTestRow()];
      const filename = `Dossier Delivery - TEST - ${new Date().toISOString().slice(0, 10)}.csv`;
      const csv = buildDeliveryCsv(rows);
      const { subject, html, text } = buildDeliveryEmailContent('Test', 1, rows, filename, {
        delivered: 1,
        thinResearchExcluded: 0,
      });

      const result = await sendDeliveryEmail({
        to,
        subject: `[TEST] ${subject}`,
        html,
        text,
        replyTo: config.deliveryReplyTo || undefined,
        attachments: [{ filename, content: Buffer.from(csv, 'utf8') }],
      });

      if (!result.ok) {
        res.status(502).json({ ok: false, error: result.error ?? 'send_failed', provider: result.provider });
        return;
      }

      res.json({
        ok: true,
        provider: result.provider,
        message_id: result.id,
        recipient: to,
        attachment: filename,
      });
    } catch (err) {
      sendInternalError(res, req, err, 'delivery_test_failed');
    }
  });
}

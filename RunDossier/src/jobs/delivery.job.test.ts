import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planDelivery, resolveSendOutcome } from './delivery.job.js';
import { shouldRunDelivery } from '../utils/delivery-trigger.js';
import { isValidEmail } from '../utils/resend.js';
import { buildDeliveryEmailContent } from '../utils/delivery-email.js';
import type { DeliveryRow } from '../utils/csv-delivery.js';

describe('shouldRunDelivery (delivery gate)', () => {
  it('delivers only when ready and the pipeline is idle', () => {
    assert.equal(shouldRunDelivery(0, 3), true);
  });

  it('does NOT deliver while prospects are still moving through the pipeline', () => {
    assert.equal(shouldRunDelivery(2, 3), false);
  });

  it('does NOT deliver when nothing is ready (no email for an empty batch)', () => {
    assert.equal(shouldRunDelivery(0, 0), false);
  });
});

describe('planDelivery', () => {
  it('sends when there are deliverable rows and a valid recipient', () => {
    assert.deepEqual(
      planDelivery({ deliverableCount: 5, internalCount: 0, hasRecipient: true }),
      { action: 'send' }
    );
  });

  it('skips the send when the client has no valid recipient email', () => {
    assert.deepEqual(
      planDelivery({ deliverableCount: 5, internalCount: 0, hasRecipient: false }),
      { action: 'no_recipient' }
    );
  });

  it('marks internal-only batches delivered without emailing', () => {
    assert.deepEqual(
      planDelivery({ deliverableCount: 0, internalCount: 4, hasRecipient: true }),
      { action: 'internal_only' }
    );
  });
});

describe('resolveSendOutcome', () => {
  it('finalizes as delivered + email_sent on a successful send', () => {
    assert.deepEqual(resolveSendOutcome({ ok: true }), {
      finalize: true,
      deliveryStatus: 'email_sent',
    });
  });

  it('does NOT finalize on provider failure, so the batch retries next cycle', () => {
    assert.deepEqual(resolveSendOutcome({ ok: false }), {
      finalize: false,
      deliveryStatus: 'email_failed',
    });
  });

  it('finalizes CSV-only (no crash) when the provider is not configured', () => {
    assert.deepEqual(resolveSendOutcome({ ok: false, skipped: true }), {
      finalize: true,
      deliveryStatus: 'skipped_not_configured',
    });
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    assert.equal(isValidEmail('client@acme.com'), true);
  });

  it('rejects empty, null, whitespace, and malformed addresses', () => {
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail(null), false);
    assert.equal(isValidEmail(undefined), false);
    assert.equal(isValidEmail('   '), false);
    assert.equal(isValidEmail('not-an-email'), false);
    assert.equal(isValidEmail('a@b'), false);
  });
});

describe('buildDeliveryEmailContent', () => {
  const rows: DeliveryRow[] = [
    { name: 'A', title: 'VP', company: 'Acme', email: 'a@acme.com', subject: 's', opener: 'o', bridge: 'b', fit_score: 80 },
    { name: 'B', title: 'Dir', company: 'Beta', email: 'b@beta.com', subject: 's', opener: 'o', bridge: 'b', fit_score: 90 },
  ];

  it('includes the prospect count, fit summary and attached filename', () => {
    const { subject, html, text } = buildDeliveryEmailContent('Sam', rows.length, rows, 'delivery.csv');
    assert.match(subject, /2 personalized openers ready/);
    assert.match(html, /Prospects delivered:<\/strong> 2/);
    assert.match(html, /delivery\.csv/);
    assert.match(text, /Average fit score: 85\/100/);
  });

  it('escapes HTML in the greeting to avoid injection in the email body', () => {
    const { html } = buildDeliveryEmailContent('<script>', 1, rows.slice(0, 1), 'f.csv');
    assert.ok(!html.includes('<script>'));
  });
});

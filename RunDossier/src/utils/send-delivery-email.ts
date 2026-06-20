import { sendResendEmail, resendConfigured, type SendResendEmailResult } from './resend.js';
import { sendGmailEmail, gmailConfigured } from './gmail-smtp.js';
import { config } from '../config.js';

function isResendFailureRecoverable(error: string | undefined): boolean {
  if (!error) return false;
  const blob = error.toLowerCase();
  return blob.includes('403') || blob.includes('not verified') || blob.includes('resend_http');
}

export interface DeliveryEmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendDeliveryEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: DeliveryEmailAttachment[];
}

export type DeliveryEmailProvider = 'resend' | 'gmail' | 'none';

export interface SendDeliveryEmailResult extends SendResendEmailResult {
  provider?: DeliveryEmailProvider;
}

function toBase64Attachments(attachments?: DeliveryEmailAttachment[]) {
  return attachments?.map((a) => ({
    filename: a.filename,
    content: a.content.toString('base64'),
  }));
}

function resolveProviderOrder(): DeliveryEmailProvider[] {
  const pref = config.deliveryEmailProvider;
  if (pref === 'gmail') return gmailConfigured() ? ['gmail'] : resendConfigured() ? ['resend'] : [];
  if (pref === 'resend') return resendConfigured() ? ['resend'] : gmailConfigured() ? ['gmail'] : [];
  if (resendConfigured()) return ['resend'];
  if (gmailConfigured()) return ['gmail'];
  return [];
}

async function sendViaProvider(
  provider: DeliveryEmailProvider,
  options: SendDeliveryEmailOptions
): Promise<SendDeliveryEmailResult> {
  if (provider === 'resend') {
    const result = await sendResendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: toBase64Attachments(options.attachments),
    });
    return { ...result, provider: 'resend' };
  }

  const result = await sendGmailEmail({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: 'text/csv',
    })),
  });
  return { ...result, provider: 'gmail' };
}

/**
 * Send delivery email via configured provider (Resend, Gmail, or auto).
 * Sends admin Gmail copy when GMAIL_DELIVERY_TO is set.
 */
export async function sendDeliveryEmail(
  options: SendDeliveryEmailOptions
): Promise<SendDeliveryEmailResult> {
  const order = resolveProviderOrder();
  if (order.length === 0) {
    return { ok: false, skipped: true, error: 'no_email_provider_configured', provider: 'none' };
  }

  let primary: SendDeliveryEmailResult | null = null;
  let lastError = 'no_email_provider_configured';

  for (const provider of order) {
    const result = await sendViaProvider(provider, options);
    if (result.ok) {
      primary = result;
      break;
    }
    lastError = result.error ?? lastError;
    if (provider === 'resend' && isResendFailureRecoverable(result.error) && gmailConfigured()) {
      const gmailResult = await sendViaProvider('gmail', options);
      if (gmailResult.ok) {
        primary = gmailResult;
        break;
      }
      lastError = gmailResult.error ?? lastError;
    }
  }

  if (!primary?.ok) {
    return { ok: false, error: lastError, provider: order[0] ?? 'none' };
  }

  const adminTo = config.gmailDeliveryTo;
  const toList = Array.isArray(options.to) ? options.to : [options.to];
  if (primary.ok && adminTo && gmailConfigured() && !toList.includes(adminTo)) {
    await sendGmailEmail({
      to: adminTo,
      subject: `[Copie admin] ${options.subject}`,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: 'text/csv',
      })),
    }).catch((err) => console.warn('[delivery-email] admin copy failed:', (err as Error).message));
  }

  return primary;
}

export function deliveryEmailConfigured(): boolean {
  return resendConfigured() || gmailConfigured();
}

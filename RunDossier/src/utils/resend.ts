import { config } from '../config.js';

export interface ResendAttachment {
  filename: string;
  content: string;
}

export interface SendResendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: ResendAttachment[];
}

export function resendConfigured(): boolean {
  return Boolean(config.resendApiKey && config.deliveryFromEmail);
}

export async function sendResendEmail(options: SendResendEmailOptions): Promise<boolean> {
  if (!resendConfigured()) {
    console.warn('[resend] RESEND_API_KEY or DELIVERY_FROM_EMAIL not set — email skipped');
    return false;
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.deliveryFromEmail,
      to,
      subject: options.subject,
      ...(options.html ? { html: options.html } : {}),
      ...(options.text ? { text: options.text } : {}),
      ...(options.attachments?.length ? { attachments: options.attachments } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[resend] API error:', res.status, body.slice(0, 300));
    return false;
  }

  return true;
}

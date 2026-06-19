import { config } from '../config.js';

const TIMEOUT_MS = 15_000;

export interface ResendAttachment {
  filename: string;
  content: string;
}

export interface SendResendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  attachments?: ResendAttachment[];
}

export interface SendResendEmailResult {
  /** True only when the provider accepted the message. */
  ok: boolean;
  /** Provider message id, when the send succeeded. */
  id?: string;
  /** Human-readable reason when ok is false. */
  error?: string;
  /** True when the send was skipped because the provider is not configured. */
  skipped?: boolean;
}

export function resendConfigured(): boolean {
  return Boolean(config.resendApiKey && config.deliveryFromEmail);
}

/** Minimal RFC-5322-ish sanity check; we only need to avoid sending to junk. */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Send an email through Resend. Never throws — transport, timeout, and API
 * errors are caught and reported via the result so callers can record a
 * terminal state and retry on the next cycle instead of crashing the worker.
 */
export async function sendResendEmail(options: SendResendEmailOptions): Promise<SendResendEmailResult> {
  if (!resendConfigured()) {
    console.warn('[resend] RESEND_API_KEY or DELIVERY_FROM_EMAIL not set — email skipped');
    return { ok: false, skipped: true, error: 'resend_not_configured' };
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
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
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
        ...(options.html ? { html: options.html } : {}),
        ...(options.text ? { text: options.text } : {}),
        ...(options.attachments?.length ? { attachments: options.attachments } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      const detail = body.slice(0, 300);
      console.error('[resend] API error:', res.status, detail);
      return { ok: false, error: `resend_http_${res.status}: ${detail}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    const message =
      (err as Error).name === 'AbortError'
        ? `resend request timed out after ${TIMEOUT_MS}ms`
        : `resend request failed: ${(err as Error).message}`;
    console.error('[resend]', message);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

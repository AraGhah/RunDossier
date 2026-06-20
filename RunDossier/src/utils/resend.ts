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
  /** Override From header (e.g. Resend sandbox) */
  from?: string;
}

export interface SendResendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
  /** Which from address succeeded */
  from?: string;
}

export function resendConfigured(): boolean {
  return Boolean(config.resendApiKey && (config.deliveryFromEmail || config.resendSandboxFrom));
}

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isResendDomainError(error: string | undefined): boolean {
  if (!error) return false;
  const blob = error.toLowerCase();
  return blob.includes('403') || blob.includes('not verified') || blob.includes('validation_error');
}

async function sendResendRequest(
  from: string,
  options: SendResendEmailOptions
): Promise<SendResendEmailResult> {
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
        from,
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
      return { ok: false, error: `resend_http_${res.status}: ${detail}`, from };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id, from };
  } catch (err) {
    const message =
      (err as Error).name === 'AbortError'
        ? `resend request timed out after ${TIMEOUT_MS}ms`
        : `resend request failed: ${(err as Error).message}`;
    console.error('[resend]', message);
    return { ok: false, error: message, from };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send via Resend. On unverified-domain 403, retries with Resend sandbox From
 * when RESEND_SANDBOX_FALLBACK is enabled (default true).
 */
export async function sendResendEmail(options: SendResendEmailOptions): Promise<SendResendEmailResult> {
  if (!config.resendApiKey) {
    console.warn('[resend] RESEND_API_KEY not set — email skipped');
    return { ok: false, skipped: true, error: 'resend_not_configured' };
  }

  const primaryFrom = options.from ?? config.deliveryFromEmail;
  if (!primaryFrom && !config.resendSandboxFrom) {
    return { ok: false, skipped: true, error: 'resend_no_from_address' };
  }

  const primary = await sendResendRequest(primaryFrom || config.resendSandboxFrom, options);
  if (primary.ok) return primary;

  if (
    config.resendSandboxFallback &&
    primaryFrom !== config.resendSandboxFrom &&
    isResendDomainError(primary.error)
  ) {
    const sandboxTo = config.deliveryTestTo
      ? config.deliveryTestTo
      : Array.isArray(options.to)
        ? options.to[0]
        : options.to;
    console.warn('[resend] primary domain failed — retrying with Resend sandbox From');
    const fallback = await sendResendRequest(config.resendSandboxFrom, {
      ...options,
      to: sandboxTo,
      subject: `${options.subject} [sandbox]`,
    });
    if (fallback.ok) return fallback;
    return {
      ok: false,
      error: `primary: ${primary.error}; sandbox: ${fallback.error}`,
      from: config.resendSandboxFrom,
    };
  }

  return primary;
}

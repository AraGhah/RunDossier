import nodemailer from 'nodemailer';
import { config } from '../config.js';

export interface GmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendGmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: GmailAttachment[];
}

export interface SendGmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

export function gmailConfigured(): boolean {
  return Boolean(config.gmailUser && config.gmailAppPassword);
}

/**
 * Send email via Gmail SMTP (app password). Never throws.
 */
export async function sendGmailEmail(options: SendGmailOptions): Promise<SendGmailResult> {
  if (!gmailConfigured()) {
    return { ok: false, skipped: true, error: 'gmail_not_configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPassword,
      },
    });

    const info = await transporter.sendMail({
      from: config.gmailUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? 'text/csv',
      })),
    });

    return { ok: true, id: info.messageId };
  } catch (err) {
    const message = (err as Error).message;
    console.error('[gmail]', message);
    return { ok: false, error: message };
  }
}

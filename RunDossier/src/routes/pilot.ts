import type { Request, Response } from 'express';
import { queryOne } from '../db.js';
import { notify } from '../notify.js';
import { containsMarkup, sanitizeEmail, sanitizeOptionalUrl, sanitizeText } from '../utils/sanitize.js';

const MAX = { name: 120, email: 254, company: 200, sequencer: 80, url: 500 } as const;
/** Common free-mail domains — pilot form expects a work email. */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com',
  'aol.com', 'mail.com', 'gmx.com', 'yandex.com', 'zoho.com',
]);

interface PilotBody {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  sequencer?: unknown;
  url?: unknown;
  /** Honeypot — must stay empty (bots fill hidden fields). */
  website?: unknown;
}

function trimField(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isWorkEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain && !FREE_EMAIL_DOMAINS.has(domain));
}

/** Silent success for bots — same shape as a real 201 without side effects. */
function respondHoneypotTrap(res: Response): void {
  res.status(201).json({ ok: true, id: 'accepted' });
}

export async function handlePilotSubmit(req: Request, res: Response): Promise<void> {
  const body = req.body as PilotBody;

  const honeypot = trimField(body.website, 200);
  if (honeypot) {
    respondHoneypotTrap(res);
    return;
  }

  const name = sanitizeText(body.name, MAX.name);
  const email = sanitizeEmail(body.email);
  const company = sanitizeText(body.company, MAX.company);
  const sequencer = sanitizeText(body.sequencer, MAX.sequencer) || null;
  const rawUrl = sanitizeText(body.url, MAX.url);
  const profileUrl = rawUrl ? sanitizeOptionalUrl(rawUrl) : null;

  if (!name || !email || !company) {
    res.status(400).json({ ok: false, error: 'name, email, and company are required' });
    return;
  }
  if ([name, company, sequencer ?? ''].some((field) => field && containsMarkup(field))) {
    res.status(400).json({ ok: false, error: 'Invalid characters in submission' });
    return;
  }
  if (!isWorkEmail(email)) {
    res.status(400).json({ ok: false, error: 'Please use your work email address' });
    return;
  }
  if (rawUrl && !profileUrl) {
    res.status(400).json({ ok: false, error: 'Invalid profile or website URL' });
    return;
  }

  try {
    const recent = await queryOne<{ id: string }>(
      `SELECT id FROM pilot_requests
       WHERE LOWER(email) = $1 AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [email]
    );
    if (recent) {
      res.status(429).json({ ok: false, error: 'A request was already submitted recently for this email' });
      return;
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO pilot_requests (name, email, company, sequencer, profile_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, email, company, sequencer, profileUrl]
    );

    if (!row) {
      res.status(500).json({ ok: false, error: 'Failed to save request' });
      return;
    }

    const lines = [
      'New pilot request (100 free lines)',
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company}`,
      sequencer ? `Sequencer: ${sequencer}` : null,
      profileUrl ? `URL: ${profileUrl}` : null,
      `ID: ${row.id}`,
    ].filter(Boolean);

    void notify(lines.join('\n'));

    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    const message = (err as Error).message;
    if (/pilot_requests|relation.*does not exist/i.test(message)) {
      res.status(503).json({
        ok: false,
        error: 'Service temporarily unavailable',
      });
      return;
    }
    console.error('[pilot] submit failed:', err);
    res.status(500).json({ ok: false, error: 'Unable to process request' });
  }
}

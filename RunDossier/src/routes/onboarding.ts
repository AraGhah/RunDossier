import { type Express, type Request, type Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import {
  createOnboardingClient,
  sendOnboardingForm,
  submitIcpBrief,
  approveAndKickoff,
} from '../services/onboarding.service.js';

type RawReq = Request & { rawBody?: Buffer };
type TallyField = { label?: string; key?: string; value?: unknown };

function verifyStripe(raw: Buffer, header: string | undefined, secret: string): boolean {
  if (!header) return false;
  const parts: Record<string, string> = {};
  for (const kv of header.split(',')) {
    const [k, v] = kv.split('=');
    if (k && v) parts[k] = v;
  }
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${raw.toString('utf8')}`).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

function verifyTally(raw: Buffer, header: string | undefined, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

async function getStripeCustomer(customerId: string): Promise<{ email?: string; name?: string }> {
  if (!config.stripeSecretKey) return {};
  const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${config.stripeSecretKey}` },
  });
  if (!res.ok) return {};
  const c = (await res.json()) as { email?: string; name?: string };
  return { email: c.email, name: c.name };
}

function fieldValue(f: TallyField): string {
  const v = f.value;
  if (Array.isArray(v)) return v.map(String).join(', ');
  return v == null ? '' : String(v);
}

function extractField(fields: TallyField[], re: RegExp): string {
  const m = fields.find((f) => re.test(f.label ?? '') || re.test(f.key ?? ''));
  return m ? fieldValue(m) : '';
}

function extractBrief(fields: TallyField[]): string {
  const labelled = fields.find((f) => /icp|ideal customer|target|brief|describe|who/i.test(f.label ?? ''));
  if (labelled && fieldValue(labelled).trim()) return fieldValue(labelled);
  let best = '';
  for (const f of fields) {
    const v = fieldValue(f);
    if (v.length > best.length) best = v;
  }
  return best;
}

/** Stripe customer.subscription.created -> create client, send onboarding form. */
export async function handleStripeWebhook(req: RawReq, res: Response): Promise<void> {
  const raw = req.rawBody;
  if (config.stripeWebhookSecret) {
    if (!raw || !verifyStripe(raw, req.header('stripe-signature'), config.stripeWebhookSecret)) {
      res.status(400).json({ error: 'invalid signature' });
      return;
    }
  }
  const event = req.body as { type?: string; data?: { object?: Record<string, any> } };
  res.status(200).json({ received: true });

  if (event?.type !== 'customer.subscription.created') return;
  try {
    const sub = event.data?.object ?? {};
    const customerId = typeof sub.customer === 'string' ? sub.customer : '';
    const cust = customerId ? await getStripeCustomer(customerId) : {};
    const email = cust.email || sub.metadata?.email;
    if (!email) {
      console.error('[stripe] no email resolvable for subscription', sub.id);
      return;
    }
    const name = cust.name || sub.metadata?.name || String(email);
    const firstName = String(name).trim().split(/\s+/)[0];
    const { client } = await createOnboardingClient({
      name: String(name),
      email: String(email),
      firstName,
      stripeCustomerId: customerId,
      stripeSubscriptionId: typeof sub.id === 'string' ? sub.id : undefined,
    });
    await sendOnboardingForm(client);
  } catch (err) {
    console.error('[stripe] onboarding error:', (err as Error).message);
  }
}

/** Tally form submit -> parse ICP with Haiku, email it back for approval. */
export async function handleTallyWebhook(req: RawReq, res: Response): Promise<void> {
  const raw = req.rawBody;
  if (config.tallySigningSecret) {
    if (!raw || !verifyTally(raw, req.header('tally-signature'), config.tallySigningSecret)) {
      res.status(400).json({ error: 'invalid signature' });
      return;
    }
  }
  const body = req.body as { data?: { fields?: TallyField[] } };
  const fields = body?.data?.fields ?? [];
  const token = extractField(fields, /client.?token|token|client.?id/i);
  const brief = extractBrief(fields);
  res.status(200).json({ received: true });

  if (!token || !brief) {
    console.error('[tally] missing client_token or ICP brief in submission');
    return;
  }
  try {
    const client = await submitIcpBrief(token, brief);
    if (!client) console.error('[tally] no client for token', token.slice(0, 8));
  } catch (err) {
    console.error('[tally] parse error:', (err as Error).message);
  }
}

function htmlPage(title: string, body: string): string {
  return (
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
    `<body style="font-family:system-ui,Segoe UI,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">` +
    `<div style="max-width:480px;text-align:center;padding:24px"><h1 style="font-size:22px">${title}</h1>` +
    `<p style="color:#9bb0c3;line-height:1.6">${body}</p></div></body>`
  );
}

/** Client clicks the approval link -> activate + first batch. */
export async function handleApprove(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    res.status(400).send(htmlPage('Invalid link', 'This approval link is missing its token.'));
    return;
  }
  const result = await approveAndKickoff(token);
  if (!result.ok) {
    const msg = result.error === 'no_icp' ? 'There is no parsed ICP to approve yet.' : 'This link is invalid or expired.';
    res.status(400).send(htmlPage('Could not approve', msg));
    return;
  }
  const extra = result.sourced ? ` ${result.sourced} prospects are queued.` : '';
  res.status(200).send(
    htmlPage('ICP approved', `Your first batch is starting.${extra} You will receive your personalized openers by email shortly.`)
  );
}

export function registerOnboardingRoutes(app: Express): void {
  if (!config.onboardingEnabled) return;
  app.post('/api/stripe/webhook', (req, res) => {
    void handleStripeWebhook(req as RawReq, res);
  });
  app.post('/api/tally/webhook', (req, res) => {
    void handleTallyWebhook(req as RawReq, res);
  });
  app.get('/api/onboarding/approve', (req, res) => {
    void handleApprove(req, res);
  });
}

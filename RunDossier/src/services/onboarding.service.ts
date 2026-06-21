import { randomBytes, createHash } from 'node:crypto';
import { query, queryOne } from '../db.js';
import { config } from '../config.js';
import { notify } from '../notify.js';
import { sendDeliveryEmail } from '../utils/send-delivery-email.js';
import { parseIcpBrief, type ParsedIcp } from '../agents/icp-parse.agent.js';
import { sourceAndIngestForClient } from './icp-sourcing.js';

const SELECT_COLS =
  'id, name, contact_email, client_first_name, status, onboarding_token, approval_token, icp_brief, icp_parsed, form_submitted_at';

export interface OnboardingClient {
  id: string;
  name: string;
  contact_email: string;
  client_first_name: string | null;
  status: string;
  onboarding_token: string | null;
  approval_token: string | null;
  icp_brief: string | null;
  icp_parsed: ParsedIcp | null;
  form_submitted_at: string | null;
}

export interface CreateOnboardingInput {
  name: string;
  email: string;
  firstName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface OnboardingFormExtras {
  offer?: string;
  brandVoice?: string[];
  targetAccounts?: string;
}

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = 'dk_live_' + randomBytes(24).toString('base64url');
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, hash, prefix: key.slice(0, 16) };
}

function randomToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function recordEvent(
  clientId: string,
  type: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await query(
    `INSERT INTO onboarding_events (client_id, event_type, metadata) VALUES ($1, $2, $3::jsonb)`,
    [clientId, type, JSON.stringify(metadata)]
  ).catch((e) => console.error('[onboarding] event log failed:', (e as Error).message));
}

function formLink(client: OnboardingClient): string {
  if (config.tallyFormUrl) {
    const sep = config.tallyFormUrl.includes('?') ? '&' : '?';
    return `${config.tallyFormUrl}${sep}client_token=${client.onboarding_token}`;
  }
  return `${config.appBaseUrl}/api/onboarding/form?token=${client.onboarding_token}`;
}

export async function getOnboardingClientByToken(token: string): Promise<OnboardingClient | null> {
  return queryOne<OnboardingClient>(`SELECT ${SELECT_COLS} FROM clients WHERE onboarding_token = $1`, [token]);
}

/** Step 1-3: create client (onboarding), generate API key + tokens. */
export async function createOnboardingClient(
  input: CreateOnboardingInput
): Promise<{ client: OnboardingClient; apiKey: string; isNew: boolean }> {
  if (input.stripeSubscriptionId) {
    const existing = await queryOne<OnboardingClient>(
      `SELECT ${SELECT_COLS} FROM clients WHERE stripe_subscription_id = $1`,
      [input.stripeSubscriptionId]
    );
    if (existing) return { client: existing, apiKey: '', isNew: false };
  }

  const { key, hash, prefix } = generateApiKey();
  const onboardingToken = randomToken();
  const approvalToken = randomToken();

  const client = await queryOne<OnboardingClient>(
    `INSERT INTO clients
       (name, contact_email, client_first_name, status, stripe_customer_id, stripe_subscription_id,
        api_key_hash, api_key_prefix, onboarding_token, approval_token)
     VALUES ($1, $2, $3, 'onboarding', $4, $5, $6, $7, $8, $9)
     RETURNING ${SELECT_COLS}`,
    [
      input.name,
      input.email,
      input.firstName ?? null,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null,
      hash,
      prefix,
      onboardingToken,
      approvalToken,
    ]
  );
  if (!client) throw new Error('Failed to create client');

  await recordEvent(client.id, 'client_created', {
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    apiKeyPrefix: prefix,
  });
  return { client, apiKey: key, isNew: true };
}

/** Step 3: email the onboarding form link. */
export async function sendOnboardingForm(client: OnboardingClient): Promise<void> {
  const url = formLink(client);
  const first = client.client_first_name || 'there';
  const html =
    `<p>Hi ${first},</p>` +
    `<p>Welcome aboard. To kick off your first batch, tell us exactly who you want to reach.</p>` +
    `<p><a href="${url}">Open your onboarding form</a></p>` +
    `<p>It takes two minutes. As soon as you submit, we read it back to you for approval before sourcing anyone.</p>`;
  const text = `Hi ${first},\n\nWelcome aboard. Tell us who you want to reach: ${url}\n\nWe will confirm your ICP before sourcing anyone.`;
  const res = await sendDeliveryEmail({
    to: client.contact_email,
    subject: 'Welcome to Dossier - tell us your ideal customer',
    html,
    text,
    replyTo: config.deliveryReplyTo || undefined,
  });
  await query(`UPDATE clients SET form_sent_at = NOW() WHERE id = $1`, [client.id]);
  await recordEvent(client.id, 'form_sent', {
    ok: res.ok,
    provider: res.provider,
    formConfigured: Boolean(config.tallyFormUrl),
  });
}

/** Step 4-5: parse the submitted brief with Haiku, store it, email it back for approval. */
export async function submitIcpBrief(
  onboardingToken: string,
  brief: string,
  extras: OnboardingFormExtras = {}
): Promise<OnboardingClient | null> {
  const client = await queryOne<OnboardingClient>(
    `SELECT ${SELECT_COLS} FROM clients WHERE onboarding_token = $1`,
    [onboardingToken]
  );
  if (!client) return null;

  const combined = extras.offer
    ? `Ideal customer:\n${brief}\n\nOffer (what they sell):\n${extras.offer}`
    : brief;
  const parsed = await parseIcpBrief(combined);
  await query(
    `UPDATE clients
       SET icp_brief = $2, icp_parsed = $3::jsonb, offer = $4,
           brand_voice_samples = $5::jsonb, target_accounts = $6,
           form_submitted_at = NOW(), status = 'pending_approval'
     WHERE id = $1`,
    [
      client.id,
      brief,
      JSON.stringify(parsed),
      extras.offer ?? parsed.offer ?? null,
      JSON.stringify(extras.brandVoice ?? []),
      extras.targetAccounts ?? null,
    ]
  );
  await recordEvent(client.id, 'icp_parsed', {
    summary: parsed.summary,
    search_query: parsed.search_query,
    hasBrandVoice: Boolean(extras.brandVoice?.length),
  });
  await sendIcpConfirmation({ ...client, icp_parsed: parsed, icp_brief: brief, status: 'pending_approval' });
  return client;
}

async function sendIcpConfirmation(client: OnboardingClient): Promise<void> {
  const icp = client.icp_parsed;
  const approveUrl = `${config.appBaseUrl}/api/onboarding/approve?token=${client.approval_token}`;
  const first = client.client_first_name || 'there';
  const summary = icp?.summary || icp?.search_query || 'your ICP';
  const details = icp
    ? `Titles: ${icp.titles.join(', ') || '-'}\n` +
      `Locations: ${icp.locations.join(', ') || '-'}\n` +
      `Industries: ${icp.industries.join(', ') || '-'}\n` +
      `Keywords: ${icp.keywords.join(', ') || '-'}`
    : '';
  const html =
    `<p>Hi ${first},</p>` +
    `<p>Here is how we read your ideal customer:</p>` +
    `<blockquote>${summary}</blockquote>` +
    `<pre>${details}</pre>` +
    `<p>If that is right, <a href="${approveUrl}">approve and start sourcing</a>. If not, just reply and we will adjust.</p>`;
  const text = `Hi ${first},\n\nHere is how we read your ICP:\n${summary}\n\n${details}\n\nApprove and start: ${approveUrl}\nIf it is off, reply and we will adjust.`;
  await sendDeliveryEmail({
    to: client.contact_email,
    subject: 'Confirm your ICP before we start',
    html,
    text,
    replyTo: config.deliveryReplyTo || undefined,
  });
  await recordEvent(client.id, 'icp_confirmation_sent', {});
}

/** Step 6: on approval, activate the client and kick off the first batch. */
export async function approveAndKickoff(
  approvalToken: string
): Promise<{ ok: boolean; clientId?: string; sourced?: number; error?: string }> {
  const client = await queryOne<OnboardingClient>(
    `SELECT ${SELECT_COLS} FROM clients WHERE approval_token = $1`,
    [approvalToken]
  );
  if (!client) return { ok: false, error: 'invalid_token' };
  if (client.status === 'active') return { ok: true, clientId: client.id, sourced: 0 };
  if (!client.icp_parsed) return { ok: false, error: 'no_icp' };

  await query(
    `UPDATE clients SET status = 'active', icp_approved_at = NOW(), activated_at = NOW() WHERE id = $1`,
    [client.id]
  );
  await recordEvent(client.id, 'icp_approved', { summary: client.icp_parsed.summary });

  const icp = client.icp_parsed;
  const searchQuery = icp.search_query || icp.titles?.[0] || 'founder';
  const location = icp.locations?.[0] || '';
  try {
    const r = await sourceAndIngestForClient({
      clientId: client.id,
      query: searchQuery,
      location,
      count: config.onboardingFirstBatchSize,
    });
    await recordEvent(client.id, 'first_batch_kicked_off', {
      sourced: r.sourced,
      inserted: r.inserted,
      skipped: r.skipped,
    });
    await notify(
      `New client activated: ${client.name} (${client.contact_email}). ` +
        `First batch queued ${r.inserted} prospects for "${searchQuery}".`
    );
    return { ok: true, clientId: client.id, sourced: r.inserted };
  } catch (err) {
    await recordEvent(client.id, 'first_batch_failed', { error: (err as Error).message });
    await notify(`Client ${client.name} approved but first batch failed: ${(err as Error).message}`);
    return { ok: true, clientId: client.id, sourced: 0, error: (err as Error).message };
  }
}

/** Timer: 72h reminder. */
export async function sendFollowUp(client: OnboardingClient): Promise<void> {
  const url = formLink(client);
  const first = client.client_first_name || 'there';
  await sendDeliveryEmail({
    to: client.contact_email,
    subject: 'Quick nudge - your Dossier onboarding',
    html: `<p>Hi ${first},</p><p>Just a nudge - we still need your ideal-customer details to start. <a href="${url}">Here is the form</a> (two minutes).</p>`,
    text: `Hi ${first},\n\nWe still need your ICP to start: ${url}`,
    replyTo: config.deliveryReplyTo || undefined,
  });
  await query(`UPDATE clients SET follow_up_sent_at = NOW() WHERE id = $1`, [client.id]);
  await recordEvent(client.id, 'follow_up_sent', {});
}

/** Timer: 7-day pause + admin alert. */
export async function pauseStalled(client: OnboardingClient): Promise<void> {
  await query(`UPDATE clients SET status = 'paused', paused_at = NOW() WHERE id = $1`, [client.id]);
  await recordEvent(client.id, 'paused_no_onboarding', {});
  await notify(
    `Onboarding stalled: ${client.name} (${client.contact_email}) never submitted the ICP form after 7 days. Status set to paused.`
  );
}

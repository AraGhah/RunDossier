/**
 * Slack posting integration (bot token -> chat.postMessage).
 * Proves the Slack delivery path for later (Step 60 wires it into delivery).
 * Reads SLACK_BOT_TOKEN from the environment; no extra config wiring needed.
 */
const SLACK_POST_URL = 'https://slack.com/api/chat.postMessage';

export function slackConfigured(): boolean {
  return Boolean((process.env.SLACK_BOT_TOKEN ?? '').trim());
}

export interface SlackPostResult {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
}

/** Post a message (text + optional Block Kit blocks) to a channel via the bot token. */
export async function postSlackMessage(opts: {
  channel: string;
  text: string;
  blocks?: unknown[];
}): Promise<SlackPostResult> {
  const token = (process.env.SLACK_BOT_TOKEN ?? '').trim();
  if (!token) return { ok: false, error: 'SLACK_BOT_TOKEN not set' };
  if (!opts.channel) return { ok: false, error: 'channel required' };

  try {
    const res = await fetch(SLACK_POST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: opts.channel,
        text: opts.text,
        ...(opts.blocks ? { blocks: opts.blocks } : {}),
      }),
    });
    const data = (await res.json()) as { ok: boolean; ts?: string; channel?: string; error?: string };
    return data.ok
      ? { ok: true, ts: data.ts, channel: data.channel }
      : { ok: false, error: data.error ?? 'unknown_slack_error' };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export interface DeliverySummary {
  clientName: string;
  count: number;
  avgFitScore?: number;
  nextDeliveryDate?: string;
}

/** Format a delivery summary as Slack text + Block Kit. */
export function formatDeliverySummary(s: DeliverySummary): { text: string; blocks: unknown[] } {
  const fit = s.avgFitScore != null ? ` · avg fit ${s.avgFitScore}/100` : '';
  const next = s.nextDeliveryDate ? ` Next batch: ${s.nextDeliveryDate}.` : '';
  const text = `Dossier delivery for ${s.clientName}: ${s.count} personalized openers ready${fit}.${next}`;
  const fields: unknown[] = [
    { type: 'mrkdwn', text: `*Client:*\n${s.clientName}` },
    { type: 'mrkdwn', text: `*Prospects:*\n${s.count}` },
  ];
  if (s.avgFitScore != null) fields.push({ type: 'mrkdwn', text: `*Avg fit:*\n${s.avgFitScore}/100` });
  if (s.nextDeliveryDate) fields.push({ type: 'mrkdwn', text: `*Next batch:*\n${s.nextDeliveryDate}` });
  const blocks: unknown[] = [
    { type: 'header', text: { type: 'plain_text', text: `New delivery: ${s.count} openers ready` } },
    { type: 'section', fields },
    { type: 'context', elements: [{ type: 'mrkdwn', text: 'Sent by Dossier · full CSV delivered by email' }] },
  ];
  return { text, blocks };
}

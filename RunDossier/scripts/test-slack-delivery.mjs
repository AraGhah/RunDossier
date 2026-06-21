/**
 * Confirm the Slack delivery path works (Step 36 "Done when").
 * Posts a sample delivery summary to a channel using your bot token.
 *
 * Setup (.env):  SLACK_BOT_TOKEN=xoxb-...    SLACK_TEST_CHANNEL=C0123ABCD
 * Run from RunDossier:
 *   node scripts/test-slack-delivery.mjs
 *   node scripts/test-slack-delivery.mjs C0123ABCD     (channel id as arg overrides env)
 */
import 'dotenv/config';

const token = (process.env.SLACK_BOT_TOKEN || '').trim();
const channel = (process.argv[2] || process.env.SLACK_TEST_CHANNEL || '').trim();

if (!token) {
  console.error('Missing SLACK_BOT_TOKEN in .env (Bot User OAuth Token, starts with xoxb-).');
  process.exit(1);
}
if (!channel) {
  console.error('Missing channel. Set SLACK_TEST_CHANNEL in .env or pass the channel id as an argument.');
  process.exit(1);
}

const s = { clientName: 'Acme (test)', count: 24, avgFitScore: 78, nextDeliveryDate: 'next Tuesday' };
const text = `Dossier delivery for ${s.clientName}: ${s.count} personalized openers ready · avg fit ${s.avgFitScore}/100. Next batch: ${s.nextDeliveryDate}.`;
const blocks = [
  { type: 'header', text: { type: 'plain_text', text: `New delivery: ${s.count} openers ready` } },
  { type: 'section', fields: [
    { type: 'mrkdwn', text: `*Client:*\n${s.clientName}` },
    { type: 'mrkdwn', text: `*Prospects:*\n${s.count}` },
    { type: 'mrkdwn', text: `*Avg fit:*\n${s.avgFitScore}/100` },
    { type: 'mrkdwn', text: `*Next batch:*\n${s.nextDeliveryDate}` },
  ] },
  { type: 'context', elements: [{ type: 'mrkdwn', text: 'Sent by Dossier (test) · full CSV delivered by email' }] },
];

const res = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ channel, text, blocks }),
});
const data = await res.json();
if (data.ok) {
  console.log(`Posted to channel ${data.channel} (ts ${data.ts}). Check Slack — the delivery summary should be there.`);
} else {
  console.error(`Slack rejected the post: ${data.error}`);
  if (data.error === 'not_in_channel') console.error('Fix: /invite your bot into the channel, then retry.');
  if (data.error === 'channel_not_found') console.error('Fix: use the channel ID (e.g. C0123ABCD), not the name.');
  if (data.error === 'invalid_auth') console.error('Fix: check SLACK_BOT_TOKEN (must be the xoxb- bot token).');
  process.exit(2);
}

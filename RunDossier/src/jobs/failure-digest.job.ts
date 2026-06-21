import { query } from '../db.js';
import { notify } from '../notify.js';
import { postSlackMessage, slackConfigured } from '../integrations/slack.js';

interface Summary {
  total: number;
  dead_letters: number;
  affected_entities: number;
}
interface TopType {
  workflow: string;
  n: number;
  latest_error: string | null;
}
interface ClientRow {
  client: string;
  n: number;
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/[\r\n`]+/g, ' ').trim().slice(0, 140);
}

/** Daily ops pulse: summarize the last 24h of failed_jobs and post it (Slack + Telegram). */
export async function runFailureDigest(): Promise<void> {
  const [summary] = await query<Summary>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE dead_letter_at IS NOT NULL OR workflow LIKE '%dead-letter%')::int AS dead_letters,
            COUNT(DISTINCT entity_id)::int AS affected_entities
     FROM failed_jobs WHERE created_at >= NOW() - INTERVAL '24 hours'`
  );
  const total = summary?.total ?? 0;
  const deadLetters = summary?.dead_letters ?? 0;
  const affected = summary?.affected_entities ?? 0;

  const topTypes = await query<TopType>(
    `SELECT workflow, COUNT(*)::int AS n,
            (array_agg(error ORDER BY created_at DESC))[1] AS latest_error
     FROM failed_jobs WHERE created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY workflow ORDER BY n DESC LIMIT 3`
  );
  const clients = await query<ClientRow>(
    `SELECT c.name AS client, COUNT(*)::int AS n
     FROM failed_jobs f
     JOIN prospects p ON p.id = f.entity_id
     JOIN clients c ON c.id = p.client_id
     WHERE f.created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY c.name ORDER BY n DESC LIMIT 5`
  );

  const date = new Date().toISOString().slice(0, 10);

  let text: string;
  if (total === 0) {
    text = `Daily failures digest (${date}) - last 24h: 0 failures. Dead-letter queue is clean.`;
  } else {
    const typeLines = topTypes
      .map((t) => `- ${t.workflow}: ${t.n}` + (t.latest_error ? ` (latest: ${clean(t.latest_error)})` : ''))
      .join('\n');
    const clientLines = clients.length
      ? clients.map((c) => `- ${c.client}: ${c.n}`).join('\n')
      : '- (none mapped to a client)';
    text =
      `Daily failures digest (${date}) - last 24h\n` +
      `Total: ${total} | Dead-letters: ${deadLetters} | Affected prospects: ${affected}\n\n` +
      `Top error types:\n${typeLines}\n\n` +
      `Affected clients:\n${clientLines}`;
  }

  // Telegram (existing ops channel) - always.
  await notify(text);

  // Slack DM/channel if configured (Step 36 integration).
  const slackChannel = (process.env.SLACK_OPS_CHANNEL ?? '').trim();
  if (slackConfigured() && slackChannel) {
    let blocks: unknown[];
    if (total === 0) {
      blocks = [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `:white_check_mark: *Daily failures digest* (${date})\nLast 24h: *0 failures*. Dead-letter queue is clean.` },
        },
      ];
    } else {
      const typeLines = topTypes
        .map((t) => `- ${t.workflow} - *${t.n}*` + (t.latest_error ? `  _(latest: ${clean(t.latest_error)})_` : ''))
        .join('\n');
      const clientLines = clients.length
        ? clients.map((c) => `- ${c.client} - *${c.n}*`).join('\n')
        : '_none mapped to a client_';
      blocks = [
        { type: 'header', text: { type: 'plain_text', text: `Daily failures digest - ${total} in 24h` } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Total:*\n${total}` },
            { type: 'mrkdwn', text: `*Dead-letters:*\n${deadLetters}` },
            { type: 'mrkdwn', text: `*Affected prospects:*\n${affected}` },
          ],
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*Top error types*\n${typeLines}` } },
        { type: 'section', text: { type: 'mrkdwn', text: `*Affected clients*\n${clientLines}` } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `Preframe ops pulse - ${date}` }] },
      ];
    }
    const r = await postSlackMessage({ channel: slackChannel, text, blocks });
    if (!r.ok) console.error('[failure-digest] Slack post failed:', r.error);
  }

  console.log(`[failure-digest] ${total} failures (${deadLetters} dead-letters, ${affected} prospects) in last 24h`);
}

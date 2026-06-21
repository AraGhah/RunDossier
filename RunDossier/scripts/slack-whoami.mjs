/**
 * Show which bot + workspace your SLACK_BOT_TOKEN belongs to.
 * Run from RunDossier:  node scripts/slack-whoami.mjs
 */
import 'dotenv/config';

const token = (process.env.SLACK_BOT_TOKEN || '').trim();
if (!token) {
  console.error('Missing SLACK_BOT_TOKEN in .env (the xoxb- bot token).');
  process.exit(1);
}

const res = await fetch('https://slack.com/api/auth.test', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
const d = await res.json();

if (!d.ok) {
  console.error('Slack rejected the token:', d.error);
  if (d.error === 'invalid_auth') console.error('Fix: SLACK_BOT_TOKEN is wrong or revoked. Re-copy it from api.slack.com/apps -> your app -> OAuth & Permissions.');
  process.exit(2);
}

console.log('');
console.log('  Bot name      : ' + d.user + '   <- invite it as  @' + d.user);
console.log('  Bot user ID   : ' + d.user_id);
console.log('  Bot ID        : ' + (d.bot_id || '(none)'));
console.log('  Workspace     : ' + d.team);
console.log('  Workspace URL : ' + d.url);
console.log('');
console.log('  /invite @' + d.user + '  only works inside the workspace above.');
console.log('  If that is NOT the workspace that has acme-shared, that is why the invite fails.');
console.log('');

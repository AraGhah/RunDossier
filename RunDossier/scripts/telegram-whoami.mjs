/**
 * Show your Telegram bot's id/username (getMe) and the chat IDs that have messaged it (getUpdates).
 *
 * 1) Create a bot with @BotFather, copy its token into .env as TELEGRAM_BOT_TOKEN.
 * 2) In Telegram, send your bot a message (e.g. /start), or add it to a group/channel and post once.
 * 3) Run from RunDossier:  node scripts/telegram-whoami.mjs
 *    -> put the chat id it prints into .env as TELEGRAM_CHAT_ID.
 */
import 'dotenv/config';

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env. Get it from @BotFather (/newbot or /mybots -> API Token).');
  console.error('The digits before the ":" in that token are the bot id.');
  process.exit(1);
}

async function tg(method) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`);
  return res.json();
}

const me = await tg('getMe');
if (!me.ok) {
  console.error('getMe failed:', me.description || JSON.stringify(me));
  console.error('Check the token. (The number before the ":" is the bot id; the full string is the token.)');
  process.exit(2);
}
console.log('');
console.log('  Bot id       : ' + me.result.id + '   (the number before the ":" in your token)');
console.log('  Bot username : @' + me.result.username);
console.log('  Bot name     : ' + me.result.first_name);

const upd = await tg('getUpdates');
const chats = new Map();
if (upd.ok) {
  for (const u of upd.result || []) {
    const m = u.message || u.channel_post || u.my_chat_member || u.edited_message;
    if (m && m.chat) chats.set(m.chat.id, m.chat);
  }
}

console.log('');
if (!upd.ok) {
  console.log('  getUpdates failed: ' + (upd.description || 'unknown') + ' (if a webhook is set, delete it to use getUpdates).');
} else if (chats.size === 0) {
  console.log('  No chats yet. Open Telegram, message your bot (send /start), then re-run this.');
} else {
  console.log('  Chats that have messaged the bot  ->  use one as TELEGRAM_CHAT_ID:');
  for (const c of chats.values()) {
    const label = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || '';
    console.log('    ' + c.id + '   [' + c.type + '] ' + label);
  }
}
console.log('');

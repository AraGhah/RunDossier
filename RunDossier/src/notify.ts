import { config } from './config.js';

export async function notify(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.telegramChatId, text: message, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    console.error('Telegram notify failed:', await res.text());
  }
}

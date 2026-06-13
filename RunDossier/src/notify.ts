import { config } from './config.js';

export async function notify(message: string): Promise<void> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn('[notify] Telegram not configured, skipping:', message.slice(0, 120));
    return;
  }

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text: message,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[notify] Telegram API error:', res.status, body);
  }
}

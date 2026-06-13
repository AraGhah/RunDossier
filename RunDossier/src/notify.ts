import { config } from './config.js';

const TIMEOUT_MS = 10_000;

export async function notify(message: string): Promise<void> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn('[notify] Telegram not configured, skipping:', message.slice(0, 120));
    return;
  }

  // Telegram hard limit is 4096 chars; stay safely under it
  const text = message.length > config.notifyMaxLength
    ? `${message.slice(0, config.notifyMaxLength - 3)}...`
    : message;

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[notify] Telegram API error:', res.status, body.slice(0, 200));
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error('[notify] Telegram request timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.error('[notify] Telegram request failed:', (err as Error).message);
    }
  } finally {
    clearTimeout(timer);
  }
}

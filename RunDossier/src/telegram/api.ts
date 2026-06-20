import { config } from '../config.js';

const API_BASE = 'https://api.telegram.org';

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  date: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function telegramApi<T>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const url = `${API_BASE}/bot${config.telegramBotToken}/${method}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string; result?: T };
    if (!res.ok || data.ok === false) {
      throw new Error(data.description ?? `Telegram API ${method} failed (${res.status})`);
    }
    return data.result as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<void> {
  const max = config.notifyMaxLength;
  const payload = text.length > max ? `${text.slice(0, max - 3)}...` : text;
  await telegramApi('sendMessage', { chat_id: chatId, text: payload });
}

export async function setTelegramWebhook(webhookUrl: string, secretToken?: string): Promise<void> {
  await telegramApi('setWebhook', {
    url: webhookUrl,
    ...(secretToken ? { secret_token: secretToken } : {}),
    allowed_updates: ['message'],
  });
}

export async function deleteTelegramWebhook(): Promise<void> {
  await telegramApi('deleteWebhook', { drop_pending_updates: false });
}

export async function getTelegramUpdates(offset?: number): Promise<TelegramUpdate[]> {
  const result = await telegramApi<TelegramUpdate[]>('getUpdates', {
    offset,
    timeout: 25,
    allowed_updates: ['message'],
  });
  return result ?? [];
}

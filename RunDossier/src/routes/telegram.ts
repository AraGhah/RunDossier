import { config } from '../config.js';
import type { TelegramUpdate } from '../telegram/api.js';
import { processTelegramUpdate } from '../telegram/handler.js';
import { logger } from '../utils/logger.js';
import { secureCompare } from '../utils/secure-compare.js';

export function registerTelegramRoutes(app: import('express').Express): void {
  app.post('/api/telegram/webhook', async (req, res) => {
    if (!config.telegramBotToken) {
      res.status(503).json({ error: 'Telegram bot not configured' });
      return;
    }

    if (process.env.NODE_ENV === 'production' && !config.telegramWebhookSecret) {
      res.status(503).json({ error: 'TELEGRAM_WEBHOOK_SECRET required in production' });
      return;
    }

    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (config.telegramWebhookSecret) {
      const provided = typeof secret === 'string' ? secret : '';
      if (!provided || !secureCompare(provided, config.telegramWebhookSecret)) {
        res.status(401).json({ error: 'Invalid webhook secret' });
        return;
      }
    }

    const update = req.body as TelegramUpdate;
    if (!update?.update_id) {
      res.status(400).json({ error: 'Invalid Telegram update' });
      return;
    }

    res.status(200).json({ ok: true });

    processTelegramUpdate(update).catch((err) => {
      logger.error('telegram_webhook_error', { error: (err as Error).message });
    });
  });
}

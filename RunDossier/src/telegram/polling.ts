import { config } from '../config.js';
import { getTelegramUpdates } from './api.js';
import { processTelegramUpdate } from './handler.js';
import { logger } from '../utils/logger.js';

let polling = false;
let offset = 0;

export async function startTelegramPolling(): Promise<void> {
  if (!config.telegramPolling || !config.telegramBotToken) return;
  if (polling) return;
  polling = true;

  logger.info('telegram_polling_started');

  const loop = async (): Promise<void> => {
    while (polling) {
      try {
        const updates = await getTelegramUpdates(offset > 0 ? offset : undefined);
        for (const update of updates) {
          offset = update.update_id + 1;
          await processTelegramUpdate(update);
        }
      } catch (err) {
        logger.error('telegram_polling_error', { error: (err as Error).message });
        await new Promise((r) => setTimeout(r, 5_000));
      }
    }
  };

  void loop();
}

export function stopTelegramPolling(): void {
  polling = false;
}

import type { TelegramUpdate } from './api.js';
import { handleTelegramCommand, isDuplicateTelegramUpdate } from './commands.js';
import { logger } from '../utils/logger.js';

export async function processTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (await isDuplicateTelegramUpdate(update.update_id)) {
    logger.info('telegram_update_duplicate', { update_id: update.update_id });
    return;
  }

  const message = update.message;
  if (!message?.text?.trim()) return;

  const chatId = message.chat.id;
  await handleTelegramCommand(update.update_id, chatId, message.text);
}

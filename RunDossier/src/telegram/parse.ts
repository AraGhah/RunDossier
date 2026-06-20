/**
 * Pure helpers for Telegram command parsing — unit-testable without DB/network.
 */

export interface ParsedTelegramCommand {
  command: string;
  args: string;
  isCommand: boolean;
}

export function parseTelegramCommand(text: string): ParsedTelegramCommand {
  const trimmed = text.trim();
  const match = trimmed.match(/^\/([a-z_]+)(?:@\w+)?(?:\s+(.*))?$/i);
  if (!match) {
    return { command: '', args: '', isCommand: false };
  }
  return {
    command: (match[1] ?? '').toLowerCase(),
    args: (match[2] ?? '').trim(),
    isCommand: true,
  };
}

export function isAuthorizedTelegramChat(
  chatId: number | string,
  allowedChatId: string | undefined
): boolean {
  if (!allowedChatId) return false;
  return String(chatId) === String(allowedChatId);
}

export function sanitizeTelegramError(message: string): string {
  const redacted = message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***')
    .replace(/apify_api_[A-Za-z0-9]+/g, 'apify_api_***')
    .replace(/sk-ant-[A-Za-z0-9-]+/g, 'sk-ant-***')
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/GMAIL_APP_PASSWORD=\S+/gi, 'GMAIL_APP_PASSWORD=***');
  return redacted.slice(0, 500);
}

const LONG_RUNNING_COMMANDS = new Set(['search', 'delivery', 'run']);

export function isLongRunningCommand(command: string): boolean {
  return LONG_RUNNING_COMMANDS.has(command);
}

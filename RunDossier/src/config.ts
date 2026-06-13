import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (
    !value ||
    value.startsWith('<') ||
    value.endsWith('...') ||
    value.includes('YOUR_PASSWORD') ||
    value.includes('YOUR_PROJECT')
  ) {
    throw new Error(`Missing or placeholder env var: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string {
  return process.env[key]?.trim() ?? '';
}

const port = parseInt(process.env.PORT || '3000', 10);
const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

export const config = {
  databaseUrl,
  databaseSsl: process.env.DATABASE_SSL === 'true'
    || databaseUrl.includes('supabase.co'),
  anthropicKey: optionalEnv('ANTHROPIC_API_KEY'),
  apifyToken: optionalEnv('APIFY_TOKEN'),
  telegramBotToken: optionalEnv('TELEGRAM_BOT_TOKEN'),
  telegramChatId: optionalEnv('TELEGRAM_CHAT_ID'),
  podcastIndexKey: optionalEnv('PODCASTINDEX_KEY') || optionalEnv('PODCAST_INDEX_KEY'),
  podcastIndexSecret: optionalEnv('PODCASTINDEX_SECRET') || optionalEnv('PODCAST_INDEX_SECRET'),
  port: Number.isFinite(port) && port > 0 ? port : 3000,

  researchModel: 'claude-haiku-4-5-20251001' as const,
  personalizeModel: 'claude-sonnet-4-6-20260514' as const,

  confidenceFloor: 60,
  qaScoreFloor: 7,
  maxRetries: 3,
  batchFailAlertPct: 0.15,
};

/** Call at startup — throws with a clear message if required secrets are missing. */
export function validateConfig(): void {
  requireEnv('DATABASE_URL');
  requireEnv('ANTHROPIC_API_KEY');
  requireEnv('APIFY_TOKEN');
}

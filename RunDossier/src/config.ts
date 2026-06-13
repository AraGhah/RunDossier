import 'dotenv/config';

const PLACEHOLDER_FRAGMENTS = [
  'YOUR_PASSWORD', 'YOUR_PROJECT', 'YOUR_', 'PLACEHOLDER',
  'sk-ant-api03-...', 'apify_api_...',
] as const;

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (
    !value ||
    value.startsWith('<') ||
    value.endsWith('...') ||
    PLACEHOLDER_FRAGMENTS.some(p => value.toUpperCase().includes(p.toUpperCase()))
  ) {
    throw new Error(`Missing or placeholder env var: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string {
  return process.env[key]?.trim() ?? '';
}

const rawPort = parseInt(process.env.PORT ?? '3000', 10);
const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

export const config = {
  databaseUrl,
  databaseSsl: process.env.DATABASE_SSL === 'true' || databaseUrl.includes('supabase.com'),
  /** Set DATABASE_SSL_STRICT=false only if your DB uses self-signed certs */
  databaseSslStrict: process.env.DATABASE_SSL_STRICT !== 'false',
  anthropicKey: optionalEnv('ANTHROPIC_API_KEY'),
  apifyToken: optionalEnv('APIFY_TOKEN'),
  telegramBotToken: optionalEnv('TELEGRAM_BOT_TOKEN'),
  telegramChatId: optionalEnv('TELEGRAM_CHAT_ID'),
  podcastIndexKey: optionalEnv('PODCASTINDEX_KEY') || optionalEnv('PODCAST_INDEX_KEY'),
  podcastIndexSecret: optionalEnv('PODCASTINDEX_SECRET') || optionalEnv('PODCAST_INDEX_SECRET'),
  port: Number.isFinite(rawPort) && rawPort > 0 && rawPort <= 65535 ? rawPort : 3000,

  researchModel: 'claude-haiku-4-5-20251001' as const,
  personalizeModel: 'claude-sonnet-4-6' as const,

  confidenceFloor: 60,
  qaScoreFloor: 7,
  variantCount: 3,
  maxRetries: 3,
  batchFailAlertPct: 0.15,
  schedulerBatchSize: 50,
  notifyMaxLength: 4000,
} as const;

/** Call at startup — throws with a clear message if required secrets are missing. */
export function validateConfig(): void {
  requireEnv('DATABASE_URL');
  requireEnv('ANTHROPIC_API_KEY');
  requireEnv('APIFY_TOKEN');
}

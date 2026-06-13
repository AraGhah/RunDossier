import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),
  telegramChatId: required('TELEGRAM_CHAT_ID'),
  anthropicApiKey: required('ANTHROPIC_API_KEY'),
  apifyApiToken: required('APIFY_API_TOKEN'),
  podcastIndexKey: process.env['PODCAST_INDEX_KEY'] ?? '',
  podcastIndexSecret: process.env['PODCAST_INDEX_SECRET'] ?? '',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  models: {
    research: 'claude-haiku-4-5-20251001',
    personalize: 'claude-sonnet-4-6',
    qa: 'claude-haiku-4-5-20251001',
  },
} as const;

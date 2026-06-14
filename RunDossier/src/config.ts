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
const rawDatabaseUrl = process.env.DATABASE_URL?.trim() ?? '';

/** pg parses sslmode= in the URL and can override our ssl.rejectUnauthorized — strip it. */
function stripSslModeParam(url: string): string {
  return url.replace(/([?&])sslmode=[^&]*(&|$)/, (_, sep, tail) => (tail === '&' ? sep : '')).replace(/\?$/, '');
}

const databaseUrl = stripSslModeParam(rawDatabaseUrl);
const isSupabase = databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co');

export const config = {
  databaseUrl,
  databaseSsl: process.env.DATABASE_SSL === 'true' || isSupabase,
  /** Only opt-in strict verification. Default false — required for Supabase on Alpine/Docker. */
  databaseSslStrict: process.env.DATABASE_SSL_STRICT === 'true',
  anthropicKey: optionalEnv('ANTHROPIC_API_KEY'),
  apifyToken: optionalEnv('APIFY_TOKEN'),
  /** Apify actor for LinkedIn profiles (approve permissions in Apify console once). */
  apifyLinkedInActor: optionalEnv('APIFY_LINKEDIN_ACTOR') || 'harvestapi~linkedin-profile-scraper',
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

  /** Workflow 10 — self-selling dogfood pipeline */
  dogfoodEnabled: process.env.DOGFOOD_ENABLED !== 'false',
  dogfoodWeeklyCap: parseInt(process.env.DOGFOOD_WEEKLY_CAP ?? '200', 10) || 200,
  dogfoodTopPercent: Math.min(1, Math.max(0.01, parseFloat(process.env.DOGFOOD_TOP_PERCENT ?? '0.3') || 0.3)),
  dogfoodScrapeBatchSize: parseInt(process.env.DOGFOOD_SCRAPE_BATCH_SIZE ?? '30', 10) || 30,
  apifySalesNavActor:
    optionalEnv('APIFY_SALES_NAV_ACTOR') || 'silentflow~linkedin-sales-navigator-scraper',
  apifySalesNavSearchUrl: optionalEnv('APIFY_SALES_NAV_SEARCH_URL'),
  linkedinSalesNavCookie: optionalEnv('LINKEDIN_SALES_NAV_COOKIE'),
  linkedinUserAgent: optionalEnv('LINKEDIN_USER_AGENT'),
  smartleadApiKey: optionalEnv('SMARTLEAD_API_KEY'),
  smartleadCampaignId: optionalEnv('SMARTLEAD_CAMPAIGN_ID'),
  dogfoodApiToken: optionalEnv('DOGFOOD_API_TOKEN'),
} as const;

/** Call at startup — throws with a clear message if required secrets are missing. */
export function validateConfig(): void {
  requireEnv('DATABASE_URL');
  requireEnv('ANTHROPIC_API_KEY');
  requireEnv('APIFY_TOKEN');
}

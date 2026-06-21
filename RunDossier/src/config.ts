import 'dotenv/config';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  /** Google AI — W4.5 QA judge (Gemini). Accepts GOOGLE_API_KEY or GEMINI_API_KEY. */
  googleApiKey: optionalEnv('GOOGLE_API_KEY') || optionalEnv('GEMINI_API_KEY'),
  /** Apollo.io — W3 people enrichment (linkedin_url match). Optional; skipped if unset. */
  apolloApiKey: optionalEnv('APOLLO_API_KEY'),
  apolloEnabled: process.env.APOLLO_ENABLED !== 'false',
  apifyToken: optionalEnv('APIFY_TOKEN'),
  /** Apify actor for LinkedIn profiles (approve permissions in Apify console once). */
  apifyLinkedInActor: optionalEnv('APIFY_LINKEDIN_ACTOR') || 'harvestapi~linkedin-profile-scraper',
  telegramBotToken: optionalEnv('TELEGRAM_BOT_TOKEN'),
  telegramChatId: optionalEnv('TELEGRAM_CHAT_ID'),
  /** Webhook secret token (X-Telegram-Bot-Api-Secret-Token header) */
  telegramWebhookSecret: optionalEnv('TELEGRAM_WEBHOOK_SECRET'),
  /** Long-polling mode for local dev (do not use with webhook) */
  telegramPolling: process.env.TELEGRAM_POLLING === 'true',
  /** Skip hourly digest when pipeline had zero activity (default: quiet) */
  telegramDigestQuiet: process.env.TELEGRAM_DIGEST_QUIET !== 'false',
  podcastIndexKey: optionalEnv('PODCASTINDEX_KEY') || optionalEnv('PODCAST_INDEX_KEY'),
  podcastIndexSecret: optionalEnv('PODCASTINDEX_SECRET') || optionalEnv('PODCAST_INDEX_SECRET'),
  port: Number.isFinite(rawPort) && rawPort > 0 && rawPort <= 65535 ? rawPort : 3000,

  researchModel: 'claude-haiku-4-5-20251001' as const,
  personalizeModel: 'claude-sonnet-4-6' as const,
  /** W4.5 — independent QA judge (n8n: models/gemini-2.5-pro) */
  qaModel: 'gemini-2.5-pro' as const,

  confidenceFloor: parseInt(process.env.CONFIDENCE_FLOOR ?? '60', 10) || 60,
  qaScoreFloor: parseInt(process.env.QA_SCORE_FLOOR ?? '7', 10) || 7,
  variantCount: parseInt(process.env.VARIANT_COUNT ?? '3', 10) || 3,
  maxRetries: parseInt(process.env.PERSONALIZE_MAX_RETRIES ?? '3', 10) || 3,
  batchFailAlertPct: 0.15,
  schedulerBatchSize: 50,
  intakeBatchSize: 50,
  notifyMaxLength: 4000,

  /** W5 delivery — writable in Docker (non-root); override with DELIVERY_DIR */
  deliveryDir:
    optionalEnv('DELIVERY_DIR') ||
    (process.env.NODE_ENV === 'production'
      ? join(tmpdir(), 'dossier-deliveries')
      : 'data/deliveries'),
  resendApiKey: optionalEnv('RESEND_API_KEY'),
  deliveryFromEmail: optionalEnv('DELIVERY_FROM_EMAIL') || 'deliveries@getdossier.co',
  /** Optional Reply-To so client replies reach a real inbox even when the From domain is no-reply. */
  deliveryReplyTo: optionalEnv('DELIVERY_REPLY_TO'),
  /** Gmail SMTP (app password) — fallback when Resend is not configured */
  gmailUser: optionalEnv('GMAIL_USER'),
  gmailAppPassword: optionalEnv('GMAIL_APP_PASSWORD'),
  /** Admin inbox for delivery copies (your Gmail) */
  gmailDeliveryTo: optionalEnv('GMAIL_DELIVERY_TO'),
  /** Email provider: auto (Resend then Gmail), resend, or gmail */
  deliveryEmailProvider: (optionalEnv('DELIVERY_EMAIL_PROVIDER') || 'auto').toLowerCase() as
    | 'auto'
    | 'resend'
    | 'gmail',
  /** Resend sandbox from when primary domain is unverified (tests + fallback) */
  resendSandboxFrom: optionalEnv('RESEND_SANDBOX_FROM') || 'onboarding@resend.dev',
  resendSandboxFallback: process.env.RESEND_SANDBOX_FALLBACK !== 'false',
  /** When true, finalize delivery without email if no provider is configured. */
  deliveryCsvOnly: process.env.DELIVERY_CSV_ONLY === 'true',
  /** Test email recipient — defaults to DELIVERY_REPLY_TO */
  deliveryTestTo: optionalEnv('DELIVERY_TEST_TO') || optionalEnv('DELIVERY_REPLY_TO'),

  /** W1 prospect search */
  searchEnabled: process.env.SEARCH_ENABLED !== 'false',
  searchDefaultMaxResults: parseInt(process.env.SEARCH_DEFAULT_MAX_RESULTS ?? '50', 10) || 50,
  searchEnrichMaxPerRun: parseInt(process.env.SEARCH_ENRICH_MAX_PER_RUN ?? '10', 10) || 10,

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

  jwtSecret: optionalEnv('JWT_SECRET'),
  jwtApiKey: optionalEnv('JWT_API_KEY'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN') || '24h',
  jwtPilotExpiresIn: optionalEnv('JWT_PILOT_EXPIRES_IN') || '15m',

  trustProxy: process.env.TRUST_PROXY === 'true',
  /** Workflow 1 - client onboarding (Stripe + Tally) */
  onboardingEnabled: process.env.ONBOARDING_ENABLED !== 'false',
  stripeSecretKey: optionalEnv('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET'),
  tallyFormUrl: optionalEnv('TALLY_FORM_URL'),
  tallySigningSecret: optionalEnv('TALLY_SIGNING_SECRET'),
  appBaseUrl: optionalEnv('APP_BASE_URL') || 'http://localhost:3000',
  onboardingFirstBatchSize: parseInt(process.env.ONBOARDING_FIRST_BATCH_SIZE ?? '25', 10) || 25,

  /** Comma-separated origins for landing → API (e.g. https://getdossier.co,http://localhost:5173) */
  corsOrigins: (optionalEnv('CORS_ORIGINS') || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
} as const;

/** Call at startup — throws with a clear message if required secrets are missing. */
export function validateConfig(): void {
  requireEnv('DATABASE_URL');
  requireEnv('ANTHROPIC_API_KEY');
  if (!config.googleApiKey) {
    throw new Error('Missing or placeholder env var: GOOGLE_API_KEY (or GEMINI_API_KEY)');
  }
  requireEnv('APIFY_TOKEN');
  requireEnv('JWT_SECRET');
  requireEnv('JWT_API_KEY');

  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  if (config.jwtApiKey.length < 16) {
    throw new Error('JWT_API_KEY must be at least 16 characters');
  }
}

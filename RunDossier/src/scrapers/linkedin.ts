import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

const client = new ApifyClient({ token: config.apifyToken });

const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?(\?[^\s]*)?$/;

const PROFILE_SCRAPER_MODE = 'Profile details no email ($4 per 1k)';

function normalizeProfileUrl(profileUrl: string): string {
  const trimmed = profileUrl.trim();
  const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  const path = parsed.pathname.replace(/\/+$/, '');
  return `https://www.linkedin.com${path}${parsed.search}`;
}

function publicIdentifierFromUrl(url: string): string | undefined {
  const match = url.match(/\/in\/([^/?]+)/);
  return match?.[1]?.replace(/\/$/, '');
}

function isPermissionError(message: string): boolean {
  return /approve its permissions|approvePermissions/i.test(message);
}

function isQuotaError(message: string): boolean {
  return /free user run limit|run limit exceeded|quota/i.test(message);
}

function isEmptyProfileError(message: string): boolean {
  return /No LinkedIn profile returned/i.test(message);
}

/** Non-retryable LinkedIn scrape failures (bad URL, quota, permissions). */
export function linkedinScrapeShouldRetry(err: Error): boolean {
  const message = err.message;
  if (isEmptyProfileError(message)) return false;
  if (isQuotaError(message)) return false;
  if (isPermissionError(message)) return false;
  return true;
}

function quotaErrorMessage(): string {
  return (
    'Quota Apify épuisé pour cet actor (plan gratuit: limite de runs). ' +
    'Attendez le reset mensuel ou passez sur un plan payant: https://apify.com/pricing'
  );
}

export async function scrapeLinkedIn(profileUrl: string): Promise<unknown> {
  const url = normalizeProfileUrl(profileUrl);

  if (!url) {
    throw new Error('LinkedIn profile URL is required');
  }
  if (!LINKEDIN_PROFILE_RE.test(url)) {
    throw new Error(
      `Invalid LinkedIn profile URL — must match https://linkedin.com/in/<handle>. Got: ${url}`
    );
  }

  const publicId = publicIdentifierFromUrl(url);

  let run;
  try {
    run = await client.actor(config.apifyLinkedInActor).call({
      urls: [url],
      ...(publicId ? { publicIdentifiers: [publicId] } : {}),
      profileScraperMode: PROFILE_SCRAPER_MODE,
      proxyConfiguration: { useApifyProxy: true },
    });
  } catch (err) {
    const message = (err as Error).message;
    if (isPermissionError(message)) {
      throw new Error(
        `${message} — Ouvrez Apify → Actors → ${config.apifyLinkedInActor} → Approve permissions.`
      );
    }
    if (isQuotaError(message)) {
      throw new Error(quotaErrorMessage());
    }
    throw err;
  }

  const statusMessage = run.statusMessage ?? '';
  if (isQuotaError(statusMessage)) {
    throw new Error(quotaErrorMessage());
  }

  if (run.status !== 'SUCCEEDED') {
    throw new Error(
      `Apify LinkedIn scrape failed (${run.status})${statusMessage ? `: ${statusMessage}` : ''}`
    );
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const profile = items.find(
    item => item && typeof item === 'object' && Object.keys(item as object).length > 0
  ) ?? null;

  if (!profile) {
    throw new Error(
      `No LinkedIn profile returned for ${url} — profil introuvable, privé, ou URL incorrecte.`
    );
  }
  return profile;
}

export function extractCompanyName(linkedInRecord: Record<string, unknown>): string {
  const company = linkedInRecord.company;
  if (company && typeof company === 'object' && company !== null) {
    const name = (company as { name?: string }).name;
    if (name) return name;
  }
  if (typeof linkedInRecord.companyName === 'string') return linkedInRecord.companyName;
  const positions = linkedInRecord.positions ?? linkedInRecord.experience;
  if (Array.isArray(positions) && positions.length > 0) {
    const first = positions[0] as { companyName?: string; company?: string };
    return first.companyName ?? first.company ?? '';
  }
  return '';
}

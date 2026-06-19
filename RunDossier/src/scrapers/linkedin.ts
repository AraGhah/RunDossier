import { ApifyClient } from 'apify-client';
import { config } from '../config.js';
import {
  ApifyScrapeError,
  apifyErrorFromThrown,
  classifyApifyFailure,
} from '../utils/apify-error.js';

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

/** Non-retryable LinkedIn scrape failures (bad URL, quota, permissions, empty). */
export function linkedinScrapeShouldRetry(err: Error): boolean {
  if (err instanceof ApifyScrapeError) {
    return !['auth', 'rate_limit', 'empty_dataset', 'bad_input'].includes(err.kind);
  }
  const message = err.message;
  if (/No LinkedIn profile returned/i.test(message)) return false;
  if (/free user run limit|run limit exceeded|quota/i.test(message)) return false;
  if (/approve its permissions|approvePermissions/i.test(message)) return false;
  return true;
}

/** One Apify actor run + dataset read. Throws ApifyScrapeError on hard failure. */
async function runProfileScrape(input: Record<string, unknown>): Promise<unknown | null> {
  let run;
  try {
    run = await client.actor(config.apifyLinkedInActor).call(input);
  } catch (err) {
    throw apifyErrorFromThrown(config.apifyLinkedInActor, err);
  }

  const status = run.status ?? '';
  const statusMessage = run.statusMessage ?? '';

  if (status !== 'SUCCEEDED') {
    throw new ApifyScrapeError(classifyApifyFailure({ status, statusMessage }), {
      actorId: config.apifyLinkedInActor,
      status,
      statusMessage,
      runId: run.id,
      datasetId: run.defaultDatasetId,
    });
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return (
    items.find(item => item && typeof item === 'object' && Object.keys(item as object).length > 0) ??
    null
  );
}

/**
 * Scrape a LinkedIn profile using a SINGLE Apify query (by canonical URL).
 * A second query (by public identifier) runs only as a recoverable fallback
 * when the first returns no profile. The number of Apify calls used is logged
 * per prospect so cost can be monitored.
 */
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
  const base = {
    profileScraperMode: PROFILE_SCRAPER_MODE,
    proxyConfiguration: { useApifyProxy: true },
  };

  let apifyCalls = 0;

  // Primary: one query by canonical URL (the cheap, common path).
  apifyCalls += 1;
  let profile = await runProfileScrape({ urls: [url], ...base });

  // Fallback: only when the URL query found nothing AND a public id is available.
  if (!profile && publicId) {
    apifyCalls += 1;
    console.info(`[linkedin] ${url} — URL query empty, fallback to publicIdentifier (call ${apifyCalls})`);
    profile = await runProfileScrape({ publicIdentifiers: [publicId], ...base });
  }

  console.info(`[linkedin] ${url} scraped with ${apifyCalls} Apify call(s)`);

  if (!profile) {
    throw new ApifyScrapeError('empty_dataset', {
      actorId: config.apifyLinkedInActor,
      statusMessage: `No LinkedIn profile returned for ${url} — profil introuvable, privé, ou URL incorrecte.`,
    });
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

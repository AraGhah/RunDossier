import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

const client = new ApifyClient({ token: config.apifyToken });

// Only allow standard LinkedIn profile URLs — prevents SSRF via crafted URLs
const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?(\?[^\s]*)?$/;

export async function scrapeLinkedIn(profileUrl: string): Promise<unknown> {
  const url = profileUrl?.trim() ?? '';

  if (!url) {
    throw new Error('LinkedIn profile URL is required');
  }
  if (!LINKEDIN_PROFILE_RE.test(url)) {
    throw new Error(
      `Invalid LinkedIn profile URL — must match https://linkedin.com/in/<handle>. Got: ${url}`
    );
  }

  const run = await client.actor('harvestapi~linkedin-profile-scraper').call({
    profileUrls: [url],
    proxyConfiguration: { useApifyProxy: true },
  });

  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Apify LinkedIn scrape failed with status: ${run.status}`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0] ?? null;
}

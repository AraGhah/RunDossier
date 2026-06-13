import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

const client = new ApifyClient({ token: config.apifyToken });

export async function scrapeLinkedIn(profileUrl: string) {
  if (!profileUrl?.trim()) {
    throw new Error('LinkedIn profile URL is required');
  }

  const run = await client.actor('harvestapi~linkedin-profile-scraper').call({
    profileUrls: [profileUrl],
    proxyConfiguration: { useApifyProxy: true },
  });

  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Apify LinkedIn scrape failed: ${run.status}`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0] ?? null;
}

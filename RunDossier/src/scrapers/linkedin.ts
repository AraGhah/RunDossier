import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

const client = new ApifyClient({ token: config.apifyApiToken });

export interface LinkedInProfile {
  linkedinUrl: string;
  fullName: string;
  headline: string;
  company: string;
  location: string;
  about: string;
}

export async function scrapeLinkedIn(profileUrls: string[]): Promise<LinkedInProfile[]> {
  const run = await client.actor('harvest-api/linkedin-profile-scraper').call({
    profileUrls,
    proxyConfiguration: { useApifyProxy: true },
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items as LinkedInProfile[];
}

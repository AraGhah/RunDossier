import crypto from 'crypto';
import { config } from '../config.js';

export async function searchPodcasts(personName: string, companyName: string) {
  if (!config.podcastIndexKey || !config.podcastIndexSecret) {
    return [];
  }

  const q = encodeURIComponent(`${personName} ${companyName}`.trim());
  const authDate = Math.floor(Date.now() / 1000);
  const authorization = crypto
    .createHash('sha1')
    .update(config.podcastIndexKey + config.podcastIndexSecret + authDate)
    .digest('hex');

  const res = await fetch(
    `https://api.podcastindex.org/api/1.0/search/byterm?q=${q}`,
    {
      headers: {
        'User-Agent': 'Preframe/1.0',
        'X-Auth-Key': config.podcastIndexKey,
        'X-Auth-Date': String(authDate),
        Authorization: authorization,
      },
    }
  );

  if (!res.ok) {
    console.warn('[podcast] Podcast Index request failed:', res.status);
    return [];
  }

  const data = await res.json();
  return (data.feeds ?? []).slice(0, 3);
}

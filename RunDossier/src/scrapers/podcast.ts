import crypto from 'crypto';
import { config } from '../config.js';

export interface PodcastEpisode {
  id: number;
  title: string;
  description: string;
  datePublished: number;
  enclosureUrl: string;
  feedTitle: string;
}

export async function searchPodcasts(query: string, max = 10): Promise<PodcastEpisode[]> {
  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const hash = crypto
    .createHash('sha1')
    .update(config.podcastIndexKey + config.podcastIndexSecret + apiHeaderTime)
    .digest('hex');

  const params = new URLSearchParams({ q: query, max: String(max) });
  const res = await fetch(`https://api.podcastindex.org/api/1.0/search/byterm?${params}`, {
    headers: {
      'X-Auth-Key': config.podcastIndexKey,
      'X-Auth-Date': String(apiHeaderTime),
      Authorization: hash,
      'User-Agent': 'RunDossier/1.0',
    },
  });

  if (!res.ok) throw new Error(`PodcastIndex error: ${res.status}`);
  const data = (await res.json()) as { feeds: PodcastEpisode[] };
  return data.feeds ?? [];
}

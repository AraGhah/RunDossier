#!/usr/bin/env tsx
/**
 * Run W1 prospect search manually.
 *
 *   npm run search -- --profile-id <uuid>
 *   npm run search -- --client-id <uuid>
 *   npm run search -- --all
 *   npm run search -- --create --client-id <uuid> --name "Ontario agencies" --search-url "https://..."
 */
import 'dotenv/config';
import { pool } from '../src/db.js';
import {
  createSearchProfile,
  listSearchProfiles,
  runProspectSearch,
  runAllEnabledSearches,
} from '../src/services/prospect-search.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const profileId = arg('--profile-id');
  const clientId = arg('--client-id');
  const runAll = process.argv.includes('--all');
  const create = process.argv.includes('--create');

  if (create) {
    const cid = arg('--client-id');
    const name = arg('--name');
    const searchUrl = arg('--search-url');
    if (!cid || !name || !searchUrl) {
      console.error('Usage: --create --client-id <uuid> --name "..." --search-url "https://linkedin.com/sales/search/..."');
      process.exit(1);
    }
    const profile = await createSearchProfile({
      client_id: cid,
      name,
      search_url: searchUrl,
      title_keywords: arg('--titles')?.split(',').map((s) => s.trim()).filter(Boolean),
      min_employees: arg('--min-employees') ? parseInt(arg('--min-employees')!, 10) : undefined,
      max_employees: arg('--max-employees') ? parseInt(arg('--max-employees')!, 10) : undefined,
      min_icp_score: arg('--min-icp') ? parseInt(arg('--min-icp')!, 10) : undefined,
      max_results_per_run: arg('--max') ? parseInt(arg('--max')!, 10) : undefined,
    });
    console.log('Created search profile:', profile.id, profile.name);
    await pool.end();
    return;
  }

  if (profileId) {
    const result = await runProspectSearch(profileId);
    console.log(JSON.stringify(result, null, 2));
  } else if (clientId) {
    const profiles = (await listSearchProfiles(clientId)).filter((p) => p.enabled);
    for (const p of profiles) {
      const result = await runProspectSearch(p.id);
      console.log(JSON.stringify(result, null, 2));
    }
  } else if (runAll) {
    const results = await runAllEnabledSearches();
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.error('Provide --profile-id, --client-id, --all, or --create');
    process.exit(1);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

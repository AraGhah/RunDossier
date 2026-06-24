#!/usr/bin/env tsx
/**
 * Validate Sales Nav URLs in .env and repair client_search_profiles rows.
 *
 *   npm exec tsx scripts/fix-search-profile-urls.ts
 *   npm exec tsx scripts/fix-search-profile-urls.ts -- --dry-run
 */
import 'dotenv/config';
import { pool, query } from '../src/db.js';
import { loadColdEmailAgencyIcpConfig, resolveProfileSearchUrl } from '../src/config/icp-profiles.js';
import { describeSalesNavSearchUrl } from '../src/utils/sales-nav-url.js';
import { upsertSearchProfile } from '../src/services/prospect-search.js';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const icp = loadColdEmailAgencyIcpConfig();

  const rows = await query<{ id: string; name: string; search_url: string }>(
    `SELECT id, name, search_url FROM client_search_profiles WHERE client_id = $1`,
    [icp.client_id]
  );

  console.log('=== Profils search en base ===');
  for (const row of rows) {
    const review = describeSalesNavSearchUrl(row.search_url);
    console.log(`- ${row.name}: valid=${review.valid} ${review.issue ?? review.preview ?? ''}`);
  }

  console.log('\n=== URLs .env (ICP) ===');
  for (const spec of icp.profiles) {
    const url = resolveProfileSearchUrl(spec);
    const review = describeSalesNavSearchUrl(url);
    console.log(`- ${spec.key} (${spec.env_url_key}): valid=${review.valid} ${review.issue ?? review.preview ?? 'missing'}`);
  }

  if (dryRun) {
    console.log('\nDry-run — aucune écriture.');
    await pool.end();
    return;
  }

  let updated = 0;
  for (const spec of icp.profiles) {
    const url = resolveProfileSearchUrl(spec);
    const review = describeSalesNavSearchUrl(url);
    if (!review.valid || !url) continue;

    await upsertSearchProfile({
      client_id: icp.client_id,
      name: spec.name,
      search_url: url,
      title_keywords: spec.title_keywords,
      min_employees: spec.min_employees,
      max_employees: spec.max_employees,
      min_icp_score: spec.min_icp_score,
      max_results_per_run: spec.max_results_per_run,
      enrich_profiles: spec.enrich_profiles,
      enabled: spec.enabled,
    });
    updated += 1;
    console.log(`\nMis à jour: ${spec.name}`);
  }

  if (updated === 0) {
    console.log('\nAucun profil corrigé — vérifiez APIFY_SALES_NAV_SEARCH_URL dans .env (URL complète Sales Navigator).');
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

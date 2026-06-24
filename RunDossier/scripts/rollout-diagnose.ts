#!/usr/bin/env tsx
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool, query } from '../src/db.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';
import { config, validateConfig } from '../src/config.js';
import { loadColdEmailAgencyIcpConfig, resolveProfileSearchUrl } from '../src/config/icp-profiles.js';
import { describeSalesNavSearchUrl } from '../src/utils/sales-nav-url.js';

async function main(): Promise<void> {
  validateConfig();
  const icp = loadColdEmailAgencyIcpConfig();
  const batch = JSON.parse(readFileSync(join(process.cwd(), 'scripts/prospects-batch.json'), 'utf8')) as Array<{ linkedin_url: string; name: string }>;
  const urls = batch.map((b) => b.linkedin_url);
  const rows = await query(
    `SELECT name, linkedin_url, status, parent_batch_id FROM prospects
      WHERE client_id = $1 AND linkedin_url = ANY($2::text[])`,
    [DEFAULT_CLIENT_ID, urls]
  );
  const profiles = await query(
    `SELECT id, name, enabled, search_url FROM client_search_profiles WHERE client_id = $1`,
    [DEFAULT_CLIENT_ID]
  ).catch(() => []);

  const icpStatus = icp.profiles.map((spec) => {
    const url = resolveProfileSearchUrl(spec);
    const envReview = describeSalesNavSearchUrl(url);
    return {
      key: spec.key,
      name: spec.name,
      url_configured: envReview.configured,
      url_valid: envReview.valid,
      env_key: spec.env_url_key,
      env_issue: envReview.issue,
    };
  });

  const searchProfilesDb = (profiles as Array<{ id: string; name: string; enabled: boolean; search_url: string }>).map(
    (p) => {
      const review = describeSalesNavSearchUrl(p.search_url);
      return {
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        url_valid: review.valid,
        search_url_preview: review.preview,
        issue: review.issue,
      };
    }
  );

  console.log(JSON.stringify({
    sales_nav_main_configured: Boolean(config.apifySalesNavSearchUrl),
    sales_nav_main_url_valid: describeSalesNavSearchUrl(config.apifySalesNavSearchUrl).valid,
    sales_nav_consulting_configured: Boolean(config.apifySalesNavSearchUrlConsulting),
    linkedin_cookie_configured: Boolean(config.linkedinSalesNavCookie),
    icp_profiles: icpStatus,
    search_profiles_db: searchProfilesDb,
    batch_prospects_in_db: rows,
    active_batches: await query(
      `SELECT id, status, requested_prospect_count, imported_count, source_exhausted
         FROM parent_batches WHERE client_id = $1 AND status IN ('queued','processing','delivering','stalled')`,
      [DEFAULT_CLIENT_ID]
    ),
  }, null, 2));
  await pool.end();
}
void main();

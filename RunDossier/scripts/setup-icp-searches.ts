#!/usr/bin/env tsx
/**
 * Provision Dossier ICP search profiles (main + consulting) for W1 sourcing.
 *
 *   npm exec tsx scripts/setup-icp-searches.ts -- --review
 *   npm exec tsx scripts/setup-icp-searches.ts -- --apply
 *   npm exec tsx scripts/setup-icp-searches.ts -- --apply --main-url "https://..."
 *   npm exec tsx scripts/setup-icp-searches.ts -- --apply --consulting-url "https://..."
 */
import 'dotenv/config';
import { pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import {
  loadColdEmailAgencyIcpConfig,
  resolveProfileSearchUrl,
  reviewIcpProfileSetup,
} from '../src/config/icp-profiles.js';
import { upsertSearchProfile, listSearchProfiles } from '../src/services/prospect-search.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function printSalesNavChecklist(): void {
  const icp = loadColdEmailAgencyIcpConfig();
  const instr = icp.saved_search_instructions;

  console.log('\n=== Sales Navigator — checklist (à sauvegarder dans LinkedIn) ===\n');
  console.log(`Locations: ${instr.locations.join(', ')}`);
  console.log(`Seniority: ${instr.seniority.join(', ')}`);
  console.log(`Company size: ${instr.company_headcount.min}-${instr.company_headcount.max} (sweet spot ${instr.company_headcount.sweet_spot})`);
  console.log(`Industries (include): ${instr.industries_include.join(', ')}`);
  console.log(`Global exclusions (post-scrape): ${icp.global_exclusions.titles_and_companies.slice(0, 8).join(', ')}…`);

  for (const spec of icp.profiles) {
    console.log(`\n--- ${spec.saved_search_name} ---`);
    console.log(`Service categories INCLUDE: ${spec.linkedin_service_categories_include.join(', ')}`);
    console.log(`Service categories EXCLUDE: ${spec.linkedin_service_categories_exclude.join(', ')}`);
    console.log(`Title keywords (post-filtre): ${spec.title_keywords.join(', ')}`);
    console.log(`Env: ${spec.env_url_key}`);
  }

  console.log('\nAprès sauvegarde dans Sales Nav, copiez chaque URL dans .env puis relancez --apply.\n');
}

async function main(): Promise<void> {
  validateConfig();
  const review = process.argv.includes('--review') || !process.argv.includes('--apply');
  const apply = process.argv.includes('--apply');
  const mainUrlArg = arg('--main-url');
  const consultingUrlArg = arg('--consulting-url');

  const icp = loadColdEmailAgencyIcpConfig();
  printSalesNavChecklist();

  const reviews = icp.profiles.map((spec) => {
    const urlOverride =
      spec.key === 'main'
        ? mainUrlArg
        : spec.key === 'consulting'
          ? consultingUrlArg
          : undefined;
    const url = urlOverride ?? resolveProfileSearchUrl(spec);
    return reviewIcpProfileSetup(spec, url);
  });

  console.log('=== Revue des profils ICP ===\n');
  for (const r of reviews) {
    console.log(`${r.profile.name} [${r.profile.segment}]`);
    console.log(`  URL: ${r.urlConfigured ? r.urlPreview : 'NON CONFIGURÉE'}`);
    for (const note of r.qualityNotes) {
      console.log(`  • ${note}`);
    }
    console.log('');
  }

  if (!apply) {
    console.log('Mode revue uniquement. Pour provisionner: npm exec tsx scripts/setup-icp-searches.ts -- --apply');
    await pool.end();
    return;
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (const r of reviews) {
    const spec = r.profile;
    const url =
      (spec.key === 'main' ? mainUrlArg : spec.key === 'consulting' ? consultingUrlArg : undefined) ??
      resolveProfileSearchUrl(spec);

    if (!url) {
      skipped.push(`${spec.name} (pas d'URL)`);
      continue;
    }

    const profile = await upsertSearchProfile({
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
    created.push(`${profile.name} → ${profile.id}`);
  }

  const all = await listSearchProfiles(icp.client_id);
  console.log('=== Résultat provisioning ===');
  console.log(`Créés/mis à jour: ${created.length}`);
  for (const line of created) console.log(`  ✓ ${line}`);
  if (skipped.length > 0) {
    console.log(`Ignorés (URL manquante): ${skipped.length}`);
    for (const line of skipped) console.log(`  ⚠ ${line}`);
  }
  console.log(`\nProfils actifs en DB: ${all.filter((p) => p.enabled).length}/${all.length}`);

  if (created.length === 0) {
    console.error('\n❌ Aucun profil créé — configurez les URLs Sales Navigator dans .env');
    process.exitCode = 1;
  } else if (skipped.length > 0) {
    console.log('\n⚠ Setup partiel — complétez la 2e URL pour activer les deux recherches.');
  } else {
    console.log('\n✅ ICP prêt pour le pipeline Dossier (W1 → W5).');
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

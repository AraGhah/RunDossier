import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IcpSegment } from '../utils/icp-fit.js';
import { describeSalesNavSearchUrl } from '../utils/sales-nav-url.js';

export interface IcpProfileSpec {
  key: string;
  name: string;
  saved_search_name: string;
  env_url_key: string;
  segment: IcpSegment;
  linkedin_service_categories_include: string[];
  linkedin_service_categories_exclude: string[];
  title_keywords: string[];
  company_keywords_hint: string[];
  min_employees: number;
  max_employees: number;
  min_icp_score: number;
  max_results_per_run: number;
  enrich_profiles: boolean;
  enabled: boolean;
}

export interface ColdEmailAgencyIcpConfig {
  version: string;
  client_id: string;
  saved_search_instructions: {
    locations: string[];
    seniority: string[];
    company_headcount: { min: number; max: number; sweet_spot: string };
    industries_include: string[];
    industries_exclude_note: string;
  };
  profiles: IcpProfileSpec[];
  global_exclusions: {
    titles_and_companies: string[];
    notes: string;
  };
}

const DEFAULT_CONFIG_PATH = join(process.cwd(), 'config', 'icp', 'cold-email-agency.v1.json');

export function loadColdEmailAgencyIcpConfig(
  configPath = DEFAULT_CONFIG_PATH
): ColdEmailAgencyIcpConfig {
  const raw = readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as ColdEmailAgencyIcpConfig;
}

export function resolveProfileSearchUrl(spec: IcpProfileSpec): string | null {
  const url = process.env[spec.env_url_key]?.trim();
  return url || null;
}

export interface IcpSetupReview {
  profile: IcpProfileSpec;
  urlConfigured: boolean;
  urlPreview: string | null;
  qualityNotes: string[];
}

export function reviewIcpProfileSetup(spec: IcpProfileSpec, url: string | null): IcpSetupReview {
  const qualityNotes: string[] = [];
  const urlReview = describeSalesNavSearchUrl(url);
  const urlConfigured = urlReview.configured;

  if (!urlConfigured) {
    qualityNotes.push(`URL manquante — définir ${spec.env_url_key} dans .env`);
  } else if (!urlReview.valid && urlReview.issue) {
    qualityNotes.push(urlReview.issue);
  }

  if (spec.segment === 'agency_main') {
    qualityNotes.push(
      `Sales Nav: inclure services ${spec.linkedin_service_categories_include.join(', ')}`
    );
    qualityNotes.push(
      `Sales Nav: exclure services ${spec.linkedin_service_categories_exclude.join(', ')}`
    );
  } else {
    qualityNotes.push('Recherche consulting séparée — uniquement consultants GTM/outbound/revenue');
  }

  qualityNotes.push(
    `Post-filtre code: titres ${spec.title_keywords.slice(0, 4).join(', ')}… | employés ${spec.min_employees}-${spec.max_employees} | score min ${spec.min_icp_score}`
  );

  return {
    profile: spec,
    urlConfigured,
    urlPreview: url ? `${url.slice(0, 60)}…` : null,
    qualityNotes,
  };
}

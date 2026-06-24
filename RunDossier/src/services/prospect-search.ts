import { query } from '../db.js';
import { config } from '../config.js';
import { notify } from '../notify.js';
import { scrapeSalesNavigatorSearch, type SalesNavLead } from '../scrapers/sales-navigator.js';
import {
  scrapeLinkedIn,
  extractCompanyName,
  linkedinScrapeShouldRetry,
} from '../scrapers/linkedin.js';
import { ingestProspects, type IntakeRecord } from './intake.js';
import { scoreIcpFit, meetsIcpForSegment, parseProfileSegment } from '../utils/icp-fit.js';
import { withRetry } from '../utils/retry.js';
import { assertValidSalesNavSearchUrl, isValidSalesNavSearchUrl } from '../utils/sales-nav-url.js';

export interface ClientSearchProfile {
  id: string;
  client_id: string;
  name: string;
  search_url: string;
  title_keywords: string[];
  min_employees: number | null;
  max_employees: number | null;
  min_icp_score: number | null;
  max_results_per_run: number;
  enrich_profiles: boolean;
  enabled: boolean;
}

export interface SearchRunResult {
  runId: string;
  profileId: string;
  clientId: string;
  leadsFound: number;
  ingested: number;
  skipped: number;
  enriched: number;
  prospectIds?: string[];
}

export interface RunProspectSearchOptions {
  parentBatchId?: string;
}

export interface CreateSearchProfileInput {
  client_id: string;
  name: string;
  search_url: string;
  title_keywords?: string[];
  min_employees?: number | null;
  max_employees?: number | null;
  min_icp_score?: number | null;
  max_results_per_run?: number;
  enrich_profiles?: boolean;
  enabled?: boolean;
}

function matchesProfile(lead: SalesNavLead, profile: ClientSearchProfile): boolean {
  const segment = parseProfileSegment(profile.name);
  if (
    !meetsIcpForSegment(
      {
        title: lead.title,
        company: lead.company,
        employeeCount: lead.employeeCount,
      },
      segment,
      profile.min_icp_score ?? 50
    )
  ) {
    return false;
  }

  if (profile.title_keywords.length > 0) {
    const title = lead.title.toLowerCase();
    const hit = profile.title_keywords.some((kw) => title.includes(kw.toLowerCase().trim()));
    if (!hit) return false;
  }

  const employees = lead.employeeCount;
  if (employees != null) {
    if (profile.min_employees != null && employees < profile.min_employees) return false;
    if (profile.max_employees != null && employees > profile.max_employees) return false;
  }

  return true;
}

function leadToIntakeRecord(lead: SalesNavLead, clientId: string, profile: ClientSearchProfile): IntakeRecord {
  const segment = parseProfileSegment(profile.name);
  return {
    name: lead.name,
    linkedin_url: lead.linkedinUrl,
    title: lead.title || undefined,
    company: lead.company || undefined,
    client_id: clientId,
    employee_count: lead.employeeCount,
    icp_fit_score: scoreIcpFit(
      {
        title: lead.title,
        company: lead.company,
        employeeCount: lead.employeeCount,
      },
      segment
    ),
  };
}

async function storeSalesNavSignal(prospectId: string, lead: SalesNavLead): Promise<void> {
  await query(
    `INSERT INTO prospect_signals_raw (prospect_id, source, raw_payload)
     VALUES ($1, 'sales_navigator', $2)`,
    [prospectId, JSON.stringify(lead)]
  );
}

async function enrichProspectProfile(prospectId: string, linkedinUrl: string): Promise<boolean> {
  try {
    const profile = await withRetry(
      () => scrapeLinkedIn(linkedinUrl),
      2,
      'search-enrich-linkedin',
      linkedinScrapeShouldRetry
    );
    if (!profile || typeof profile !== 'object') return false;

    const record = profile as Record<string, unknown>;
    const company = extractCompanyName(record) || null;
    const headline =
      typeof record.headline === 'string'
        ? record.headline
        : typeof record.title === 'string'
          ? record.title
          : null;

    await query(
      `INSERT INTO prospect_signals_raw (prospect_id, source, raw_payload)
       VALUES ($1, 'linkedin', $2)`,
      [prospectId, JSON.stringify(record)]
    );

    await query(
      `UPDATE prospects
       SET company = COALESCE(NULLIF(company, ''), $1),
           title = COALESCE(NULLIF(title, ''), $2)
       WHERE id = $3`,
      [company, headline, prospectId]
    );
    return true;
  } catch (err) {
    console.warn('[prospect-search] enrich failed:', prospectId, (err as Error).message);
    return false;
  }
}

export async function listSearchProfiles(clientId?: string): Promise<ClientSearchProfile[]> {
  if (clientId) {
    return query<ClientSearchProfile>(
      `SELECT id, client_id, name, search_url, title_keywords,
              min_employees, max_employees, min_icp_score,
              max_results_per_run, enrich_profiles, enabled
       FROM client_search_profiles
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [clientId]
    );
  }
  return query<ClientSearchProfile>(
    `SELECT id, client_id, name, search_url, title_keywords,
            min_employees, max_employees, min_icp_score,
            max_results_per_run, enrich_profiles, enabled
     FROM client_search_profiles
     ORDER BY created_at DESC`
  );
}

export async function createSearchProfile(input: CreateSearchProfileInput): Promise<ClientSearchProfile> {
  assertValidSalesNavSearchUrl(input.search_url);
  const [row] = await query<ClientSearchProfile>(
    `INSERT INTO client_search_profiles (
       client_id, name, search_url, title_keywords,
       min_employees, max_employees, min_icp_score,
       max_results_per_run, enrich_profiles, enabled
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, client_id, name, search_url, title_keywords,
               min_employees, max_employees, min_icp_score,
               max_results_per_run, enrich_profiles, enabled`,
    [
      input.client_id,
      input.name.trim(),
      input.search_url.trim(),
      input.title_keywords ?? [],
      input.min_employees ?? null,
      input.max_employees ?? null,
      input.min_icp_score ?? null,
      input.max_results_per_run ?? config.searchDefaultMaxResults,
      input.enrich_profiles ?? true,
      input.enabled ?? true,
    ]
  );
  if (!row) throw new Error('Failed to create search profile');
  return row;
}

/** Idempotent create/update by client + profile name. */
export async function upsertSearchProfile(input: CreateSearchProfileInput): Promise<ClientSearchProfile> {
  assertValidSalesNavSearchUrl(input.search_url);
  const [existing] = await query<ClientSearchProfile>(
    `SELECT id, client_id, name, search_url, title_keywords,
            min_employees, max_employees, min_icp_score,
            max_results_per_run, enrich_profiles, enabled
     FROM client_search_profiles
     WHERE client_id = $1 AND name = $2
     LIMIT 1`,
    [input.client_id, input.name.trim()]
  );

  if (existing) {
    const [updated] = await query<ClientSearchProfile>(
      `UPDATE client_search_profiles
       SET search_url = $3,
           title_keywords = $4,
           min_employees = $5,
           max_employees = $6,
           min_icp_score = $7,
           max_results_per_run = $8,
           enrich_profiles = $9,
           enabled = $10,
           updated_at = NOW()
       WHERE id = $1 AND client_id = $2
       RETURNING id, client_id, name, search_url, title_keywords,
                 min_employees, max_employees, min_icp_score,
                 max_results_per_run, enrich_profiles, enabled`,
      [
        existing.id,
        input.client_id,
        input.search_url.trim(),
        input.title_keywords ?? [],
        input.min_employees ?? null,
        input.max_employees ?? null,
        input.min_icp_score ?? null,
        input.max_results_per_run ?? config.searchDefaultMaxResults,
        input.enrich_profiles ?? true,
        input.enabled ?? true,
      ]
    );
    if (!updated) throw new Error('Failed to update search profile');
    return updated;
  }

  return createSearchProfile(input);
}

export async function getSearchProfile(profileId: string): Promise<ClientSearchProfile | null> {
  const [row] = await query<ClientSearchProfile>(
    `SELECT id, client_id, name, search_url, title_keywords,
            min_employees, max_employees, min_icp_score,
            max_results_per_run, enrich_profiles, enabled
     FROM client_search_profiles WHERE id = $1`,
    [profileId]
  );
  return row ?? null;
}

export async function runProspectSearch(
  profileId: string,
  options: RunProspectSearchOptions = {}
): Promise<SearchRunResult> {
  const profile = await getSearchProfile(profileId);
  if (!profile) throw new Error(`Search profile not found: ${profileId}`);
  if (!profile.enabled) throw new Error(`Search profile disabled: ${profile.name}`);
  if (!isValidSalesNavSearchUrl(profile.search_url)) {
    throw new Error(
      `Search profile "${profile.name}" has an invalid search_url — run npm run icp:apply after setting a full Sales Navigator URL in .env`
    );
  }

  const [run] = await query<{ id: string }>(
    `INSERT INTO search_runs (profile_id, client_id, status)
     VALUES ($1, $2, 'running')
     RETURNING id`,
    [profile.id, profile.client_id]
  );
  if (!run) throw new Error('Failed to create search run');

  const finish = async (
    status: 'completed' | 'failed',
    stats: Partial<SearchRunResult> & { error?: string; prospectIds?: string[] }
  ): Promise<SearchRunResult> => {
    await query(
      `UPDATE search_runs
       SET status = $1, leads_found = $2, leads_ingested = $3, leads_skipped = $4,
           leads_enriched = $5, error_message = $6, completed_at = NOW()
       WHERE id = $7`,
      [
        status,
        stats.leadsFound ?? 0,
        stats.ingested ?? 0,
        stats.skipped ?? 0,
        stats.enriched ?? 0,
        stats.error ?? null,
        run.id,
      ]
    );
    return {
      runId: run.id,
      profileId: profile.id,
      clientId: profile.client_id,
      leadsFound: stats.leadsFound ?? 0,
      ingested: stats.ingested ?? 0,
      skipped: stats.skipped ?? 0,
      enriched: stats.enriched ?? 0,
      prospectIds: stats.prospectIds,
    };
  };

  try {
    const rawLeads = await scrapeSalesNavigatorSearch({
      searchUrl: profile.search_url,
      maxResults: profile.max_results_per_run,
    });

    const filtered = rawLeads.filter((lead) => matchesProfile(lead, profile));
    const intakeRecords = filtered.map((lead) => leadToIntakeRecord(lead, profile.client_id, profile));

    const intake = await ingestProspects(intakeRecords, {
      source: 'search',
      parentBatchId: options.parentBatchId,
    });

    const leadByUrl = new Map(filtered.map((l) => [l.linkedinUrl, l]));
    for (const prospectId of intake.prospectIds) {
      const [row] = await query<{ linkedin_url: string }>(
        `SELECT linkedin_url FROM prospects WHERE id = $1`,
        [prospectId]
      );
      const lead = row?.linkedin_url ? leadByUrl.get(row.linkedin_url) : undefined;
      if (lead) await storeSalesNavSignal(prospectId, lead);
    }

    let enriched = 0;
    if (profile.enrich_profiles && intake.prospectIds.length > 0) {
      const cap = Math.min(intake.prospectIds.length, config.searchEnrichMaxPerRun);
      for (let i = 0; i < cap; i += 1) {
        const prospectId = intake.prospectIds[i];
        const [row] = await query<{ linkedin_url: string }>(
          `SELECT linkedin_url FROM prospects WHERE id = $1`,
          [prospectId]
        );
        if (!row?.linkedin_url) continue;
        const ok = await enrichProspectProfile(prospectId, row.linkedin_url);
        if (ok) enriched += 1;
      }
    }

    const result = await finish('completed', {
      leadsFound: filtered.length,
      ingested: intake.inserted,
      skipped: intake.skipped + intake.invalid,
      enriched,
      prospectIds: intake.prospectIds,
    });

    if (result.ingested > 0) {
      await notify(
        `W1 Search "${profile.name}": ${result.ingested} prospect(s) queued, ${result.enriched} enriched`
      );
    }

    return result;
  } catch (err) {
    const message = (err as Error).message;
    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('W1 - Prospect Search', $1, $2, 0)`,
      [profile.id, message]
    ).catch(() => {});
    await finish('failed', { error: message });
    await notify(`W1 Search failed (${profile.name}): ${message}`);
    throw err;
  }
}

export async function runAllEnabledSearches(): Promise<SearchRunResult[]> {
  if (!config.searchEnabled) {
    console.log('[prospect-search] disabled (SEARCH_ENABLED=false)');
    return [];
  }

  const profiles = await query<{ id: string }>(
    `SELECT id FROM client_search_profiles WHERE enabled = true ORDER BY created_at`
  );

  const results: SearchRunResult[] = [];
  for (const { id } of profiles) {
    try {
      results.push(await runProspectSearch(id));
    } catch (err) {
      console.error('[prospect-search] profile error:', id, err);
    }
  }
  return results;
}

import { config } from '../config.js';

const APOLLO_MATCH_URL = 'https://api.apollo.io/api/v1/people/match';

export interface ApolloEnrichInput {
  linkedinUrl: string;
  name?: string;
  email?: string;
  title?: string;
  company?: string;
}

interface ApolloMatchResponse {
  person?: Record<string, unknown> | null;
  error?: string;
  error_message?: string;
}

function splitName(fullName: string): { first_name?: string; last_name?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { first_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

function buildMatchUrl(input: ApolloEnrichInput): string {
  const params = new URLSearchParams({
    reveal_personal_emails: 'false',
    reveal_phone_number: 'false',
    linkedin_url: input.linkedinUrl.trim(),
  });

  if (input.email?.trim()) params.set('email', input.email.trim());
  if (input.title?.trim()) params.set('title', input.title.trim());
  if (input.company?.trim()) params.set('organization_name', input.company.trim());

  const { first_name, last_name } = splitName(input.name ?? '');
  if (first_name) params.set('first_name', first_name);
  if (last_name) params.set('last_name', last_name);

  return `${APOLLO_MATCH_URL}?${params.toString()}`;
}

/** Enrich a prospect via Apollo People Match (LinkedIn URL + optional identifiers). */
export async function enrichPersonViaApollo(
  input: ApolloEnrichInput
): Promise<Record<string, unknown> | null> {
  if (!config.apolloEnabled || !config.apolloApiKey) {
    return null;
  }

  const url = buildMatchUrl(input);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      'x-api-key': config.apolloApiKey,
    },
    body: '{}',
  });

  const data = (await res.json()) as ApolloMatchResponse;

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Apollo API auth failed (${res.status})`);
  }

  if (!res.ok) {
    const msg = data.error_message ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(`Apollo people/match failed: ${msg}`);
  }

  const person = data.person;
  if (!person || typeof person !== 'object' || Object.keys(person).length === 0) {
    return null;
  }

  return person;
}

// ---------------------------------------------------------------------------
// Apollo People Search — used by campaign sourcing worker
// ---------------------------------------------------------------------------

const APOLLO_SEARCH_URL = 'https://api.apollo.io/api/v1/mixed_people/search';

export interface ApolloPerson {
  name: string;
  linkedinUrl: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
}

export interface ApolloSearchOptions {
  job_titles?: string[];
  locations?: string[];
  industry?: string;
  seniority?: string[];
  company_size?: string[];
  keywords?: string[];
  exclusion_keywords?: string[];
  page?: number;
  per_page?: number;
}

interface ApolloSearchResponse {
  people?: Record<string, unknown>[];
  contacts?: Record<string, unknown>[];
  pagination?: { total_entries?: number; total_pages?: number };
  error?: string;
  error_message?: string;
}

function extractPersonFromApolloResult(row: Record<string, unknown>): ApolloPerson | null {
  const name =
    (typeof row.name === 'string' ? row.name : '') ||
    [row.first_name, row.last_name].filter(s => typeof s === 'string' && s).join(' ');
  if (!name.trim()) return null;

  const linkedinUrl =
    typeof row.linkedin_url === 'string' && row.linkedin_url.includes('linkedin.com/in/')
      ? row.linkedin_url.trim()
      : null;
  if (!linkedinUrl) return null;

  const title = typeof row.title === 'string' ? row.title.trim() : null;
  const company =
    (typeof row.organization_name === 'string' ? row.organization_name.trim() : '') ||
    (row.organization && typeof (row.organization as Record<string, unknown>).name === 'string'
      ? ((row.organization as Record<string, unknown>).name as string).trim()
      : '') ||
    null;

  const email =
    typeof row.email === 'string' && row.email.includes('@') ? row.email.toLowerCase().trim() : null;

  return { name: name.trim(), linkedinUrl, title, company, email };
}

/** Search for prospects via Apollo.io mixed people search. Returns up to `per_page` results per call. */
export async function searchPeopleViaApollo(
  opts: ApolloSearchOptions
): Promise<{ people: ApolloPerson[]; totalEntries: number; totalPages: number }> {
  if (!config.apolloApiKey) {
    throw new Error('APOLLO_API_KEY not configured — cannot source prospects via Apollo');
  }

  const body: Record<string, unknown> = {
    per_page: opts.per_page ?? 25,
    page: opts.page ?? 1,
  };

  if (opts.job_titles?.length) body.person_titles = opts.job_titles;
  if (opts.locations?.length) body.person_locations = opts.locations;
  if (opts.seniority?.length) body.person_seniorities = opts.seniority;
  if (opts.industry) body.q_organization_industries = [opts.industry];
  if (opts.keywords?.length) body.q_keywords = opts.keywords.join(' ');

  const res = await fetch(APOLLO_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      'x-api-key': config.apolloApiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ApolloSearchResponse;

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Apollo API auth failed (${res.status})`);
  }
  if (!res.ok) {
    const msg = data.error_message ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(`Apollo people search failed: ${msg}`);
  }

  const rows = [...(data.people ?? []), ...(data.contacts ?? [])];
  const people = rows.map(r => extractPersonFromApolloResult(r)).filter((p): p is ApolloPerson => p !== null);

  return {
    people,
    totalEntries: data.pagination?.total_entries ?? people.length,
    totalPages: data.pagination?.total_pages ?? 1,
  };
}

export function extractCompanyFromApollo(person: Record<string, unknown>): string {
  const org = person.organization;
  if (org && typeof org === 'object' && org !== null) {
    const name = (org as { name?: string }).name;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  if (typeof person.organization_name === 'string' && person.organization_name.trim()) {
    return person.organization_name.trim();
  }
  const history = person.employment_history;
  if (Array.isArray(history) && history.length > 0) {
    const current = history.find(
      (row): row is Record<string, unknown> =>
        typeof row === 'object' && row !== null && (row as { current?: boolean }).current === true
    ) ?? history[0];
    if (current && typeof current === 'object') {
      const orgName = (current as { organization_name?: string }).organization_name;
      if (typeof orgName === 'string' && orgName.trim()) return orgName.trim();
    }
  }
  return '';
}

export function extractEmailFromApollo(person: Record<string, unknown>): string | null {
  const email = person.email;
  if (typeof email === 'string' && email.includes('@')) {
    return email.trim().toLowerCase();
  }
  return null;
}

export function extractTitleFromApollo(person: Record<string, unknown>): string | null {
  const title = person.title ?? person.headline;
  if (typeof title === 'string' && title.trim()) return title.trim();
  return null;
}

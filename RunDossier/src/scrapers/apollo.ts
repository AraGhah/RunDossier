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

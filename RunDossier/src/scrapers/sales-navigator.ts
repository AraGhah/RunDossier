import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

const client = new ApifyClient({ token: config.apifyToken });

export interface SalesNavLead {
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  employeeCount: number | null;
}

export interface SalesNavSearchOptions {
  searchUrl: string;
  maxResults?: number;
  actorId?: string;
  cookie?: string;
  userAgent?: string;
}

const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?/i;

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
    if (typeof value === 'string') {
      const match = value.match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
  }
  return null;
}

function normalizeLinkedInUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    const normalized = `https://www.linkedin.com${path.startsWith('/') ? path : `/${path}`}`;
    return LINKEDIN_PROFILE_RE.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function mapItem(item: unknown): SalesNavLead | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;

  const linkedinUrl = normalizeLinkedInUrl(
    pickString(row, [
      'linkedinUrl', 'linkedin_url', 'profileUrl', 'profile_url', 'url',
      'linkedInUrl', 'publicProfileUrl',
    ])
  );
  if (!linkedinUrl) return null;

  const firstName = pickString(row, ['firstName', 'first_name']);
  const lastName = pickString(row, ['lastName', 'last_name']);
  const fullName =
    pickString(row, ['fullName', 'full_name', 'name', 'profileName']) ||
    [firstName, lastName].filter(Boolean).join(' ');

  if (!fullName) return null;

  const company =
    pickString(row, ['company', 'companyName', 'company_name', 'currentCompany']) ||
    (typeof row.company === 'object' && row.company !== null
      ? pickString(row.company as Record<string, unknown>, ['name', 'companyName'])
      : '');

  const title = pickString(row, [
    'title', 'jobTitle', 'job_title', 'headline', 'position', 'currentTitle',
  ]);

  const employeeCount = pickNumber(row, [
    'employeeCount', 'employee_count', 'companySize', 'company_size',
    'employees', 'staffCount', 'staff_count',
  ]);

  return { name: fullName, title, company, linkedinUrl, employeeCount };
}

export async function scrapeSalesNavigatorSearch(
  options: SalesNavSearchOptions
): Promise<SalesNavLead[]> {
  const searchUrl = options.searchUrl?.trim();
  if (!searchUrl) {
    throw new Error('searchUrl is required for Sales Navigator scrape');
  }

  const maxResults = options.maxResults ?? config.dogfoodScrapeBatchSize;
  const actorId = options.actorId ?? config.apifySalesNavActor;

  const input: Record<string, unknown> = {
    searchUrl,
    maxResults,
    proxyConfiguration: { useApifyProxy: true },
  };

  const cookie = options.cookie ?? config.linkedinSalesNavCookie;
  const userAgent = options.userAgent ?? config.linkedinUserAgent;
  if (cookie) input.cookie = cookie;
  if (userAgent) input.userAgent = userAgent;

  const run = await client.actor(actorId).call(input);

  if (run.status !== 'SUCCEEDED') {
    throw new Error(
      `Apify Sales Navigator scrape failed (${run.status})${run.statusMessage ? `: ${run.statusMessage}` : ''}`
    );
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const seen = new Set<string>();
  const leads: SalesNavLead[] = [];

  for (const item of items) {
    const lead = mapItem(item);
    if (!lead || seen.has(lead.linkedinUrl)) continue;
    seen.add(lead.linkedinUrl);
    leads.push(lead);
  }

  return leads;
}

/** Dogfood default — uses APIFY_SALES_NAV_SEARCH_URL from env. */
export async function scrapeSalesNavigator(): Promise<SalesNavLead[]> {
  if (!config.apifySalesNavSearchUrl) {
    throw new Error(
      'APIFY_SALES_NAV_SEARCH_URL manquant — collez une URL Sales Navigator filtrée (titres + 10–50 employés).'
    );
  }
  return scrapeSalesNavigatorSearch({
    searchUrl: config.apifySalesNavSearchUrl,
    maxResults: config.dogfoodScrapeBatchSize,
  });
}

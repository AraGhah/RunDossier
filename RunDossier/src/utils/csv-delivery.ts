export interface DeliveryRow {
  client_name: string;
  prospect_name: string;
  title: string;
  company: string;
  company_domain: string;
  linkedin_url: string;
  email: string;
  research_signals: string;
  source_links: string;
  research_summary: string;
  confidence_score: number;
  subject: string;
  opener: string;
  bridge: string;
  variant_number: number;
  prospect_status: string;
  batch_id: string;
  delivery_id: string;
  run_id: string;
  generated_at: string;
}

const INTERNAL_EMAILS = new Set([
  'ara@getdossier.co',
  'ara.ghahramanyan@gmail.com',
  'joe@getdossier.co',
  'joe.haderco@gmail.com',
  'test@example.com',
]);

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return INTERNAL_EMAILS.has(email.trim().toLowerCase());
}

export function extractCompanyDomain(email: string | null | undefined, company: string): string {
  if (email?.includes('@')) {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      return domain;
    }
  }
  const slug = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return slug ? `${slug}.com` : '';
}

export function formatResearchSignals(signals: unknown): { text: string; sources: string } {
  if (!Array.isArray(signals)) return { text: '', sources: '' };
  const parts: string[] = [];
  const sources: string[] = [];
  for (const s of signals) {
    if (!s || typeof s !== 'object') continue;
    const rec = s as Record<string, unknown>;
    const signal = String(rec.signal ?? '').trim();
    const source = String(rec.source ?? '').trim();
    if (signal) parts.push(signal);
    if (source) sources.push(source);
  }
  return { text: parts.join(' | '), sources: sources.join(' | ') };
}

const CSV_HEADER =
  'client_name,prospect_name,title,company,company_domain,linkedin_url,email,research_signals,source_links,research_summary,confidence_score,subject,opener,bridge,variant_number,prospect_status,batch_id,delivery_id,run_id,generated_at';

export function buildDeliveryCsv(rows: DeliveryRow[]): string {
  const lines = rows.map((r) =>
    [
      escapeCsvField(r.client_name),
      escapeCsvField(r.prospect_name),
      escapeCsvField(r.title ?? ''),
      escapeCsvField(r.company ?? ''),
      escapeCsvField(r.company_domain ?? ''),
      escapeCsvField(r.linkedin_url ?? ''),
      escapeCsvField(r.email ?? ''),
      escapeCsvField(r.research_signals ?? ''),
      escapeCsvField(r.source_links ?? ''),
      escapeCsvField(r.research_summary ?? ''),
      String(r.confidence_score ?? 0),
      escapeCsvField(r.subject),
      escapeCsvField(r.opener),
      escapeCsvField(r.bridge),
      String(r.variant_number ?? 1),
      escapeCsvField(r.prospect_status ?? 'personalized_qa_passed'),
      escapeCsvField(r.batch_id ?? ''),
      escapeCsvField(r.delivery_id ?? ''),
      escapeCsvField(r.run_id ?? ''),
      escapeCsvField(r.generated_at ?? ''),
    ].join(',')
  );
  return [CSV_HEADER, ...lines].join('\n');
}

export function filterDeliveryRows(rows: DeliveryRow[]): DeliveryRow[] {
  return rows.filter((r) => !isInternalEmail(r.email));
}

/** @deprecated use DeliveryRow fields directly — kept for email fit score average */
export function averageFitScore(rows: Pick<DeliveryRow, 'confidence_score'>[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + (row.confidence_score ?? 0), 0);
  return Math.round(sum / rows.length);
}

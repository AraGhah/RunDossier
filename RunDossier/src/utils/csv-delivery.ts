export interface DeliveryRow {
  name: string;
  title: string;
  company: string;
  email: string;
  subject: string;
  opener: string;
  bridge: string;
  fit_score: number;
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

export function buildDeliveryCsv(rows: DeliveryRow[]): string {
  const header = 'name,title,company,email,subject,opener,bridge,fit_score';
  const lines = rows.map(r =>
    [
      escapeCsvField(r.name),
      escapeCsvField(r.title ?? ''),
      escapeCsvField(r.company ?? ''),
      escapeCsvField(r.email ?? ''),
      escapeCsvField(r.subject),
      escapeCsvField(r.opener),
      escapeCsvField(r.bridge),
      String(r.fit_score ?? 0),
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

export function filterDeliveryRows(rows: DeliveryRow[]): DeliveryRow[] {
  return rows.filter(r => !isInternalEmail(r.email));
}

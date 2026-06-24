const SALES_NAV_URL_RE = /^https:\/\/(www\.)?linkedin\.com\/sales\/search\//i;

/** Full Sales Navigator search URL from the browser address bar. */
export function isValidSalesNavSearchUrl(url: string): boolean {
  return SALES_NAV_URL_RE.test(url.trim());
}

export function assertValidSalesNavSearchUrl(url: string, field = 'search_url'): void {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  if (isValidSalesNavSearchUrl(trimmed)) return;

  const looksLikeToken = /^[A-Za-z0-9_-]{20,}$/.test(trimmed) && !trimmed.includes('/');
  throw new Error(
    looksLikeToken
      ? `${field} looks like a LinkedIn query token — paste the full URL from Sales Navigator (https://www.linkedin.com/sales/search/...)`
      : `${field} must be a LinkedIn Sales Navigator search URL (https://www.linkedin.com/sales/search/...)`
  );
}

export function describeSalesNavSearchUrl(url: string | null | undefined): {
  configured: boolean;
  valid: boolean;
  preview: string | null;
  issue: string | null;
} {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) {
    return { configured: false, valid: false, preview: null, issue: 'URL manquante' };
  }
  if (!isValidSalesNavSearchUrl(trimmed)) {
    const looksLikeToken = /^[A-Za-z0-9_-]{20,}$/.test(trimmed) && !trimmed.includes('/');
    return {
      configured: true,
      valid: false,
      preview: `${trimmed.slice(0, 24)}…`,
      issue: looksLikeToken
        ? 'Token LinkedIn seul — coller l’URL complète depuis la barre d’adresse Sales Navigator'
        : 'URL invalide — doit commencer par https://www.linkedin.com/sales/search/',
    };
  }
  return {
    configured: true,
    valid: true,
    preview: trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed,
    issue: null,
  };
}

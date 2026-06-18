/** Strip control chars and trim user-controlled strings before persistence. */
export function sanitizeText(
  value: unknown,
  maxLen = 500,
): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

/** Reject strings that look like HTML/script injection in free-text fields. */
export function containsMarkup(value: string): boolean {
  return /<[^>]+>|javascript:|on\w+\s*=/i.test(value);
}

export function sanitizeEmail(value: unknown): string {
  const email = sanitizeText(value, 254).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

export function sanitizeOptionalUrl(value: unknown, maxLen = 2048): string {
  const raw = sanitizeText(value, maxLen);
  if (!raw) return '';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

const BANNED_PHRASES = [
  'i came across your profile',
  'i loved your post',
  'impressive work',
  'i noticed',
  'i saw',
  'i was impressed',
  'congrats on',
  'we help companies',
] as const;

const PLACEHOLDER_RE = /\[[^\]]+\]|\{[^}]+\}|TODO|TBD|xxx/i;

export function hasBannedPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

export function hasPlaceholder(text: string): boolean {
  return PLACEHOLDER_RE.test(text);
}

export function validateVariantFields(subject: string, opener: string, bridge: string): string | null {
  if (!subject.trim() || !opener.trim() || !bridge.trim()) {
    return 'subject, opener, and bridge are required';
  }
  if (hasPlaceholder(subject) || hasPlaceholder(opener) || hasPlaceholder(bridge)) {
    return 'placeholder tokens detected';
  }
  if (hasBannedPhrase(opener) || hasBannedPhrase(bridge)) {
    return 'banned phrase detected';
  }
  return null;
}

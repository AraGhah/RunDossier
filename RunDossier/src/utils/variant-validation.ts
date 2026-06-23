const BANNED_PHRASES = [
  'i came across your profile',
  'i loved your post',
  'impressive work',
  'i noticed',
  'i saw',
  'i was impressed',
  'congrats on',
  'we help companies',
  'hope this finds you well',
  'just reaching out',
  'quick question',
  'i wanted to reach out',
  'pick your brain',
  'touch base',
  'circle back',
  'synergy',
  'game-changer',
  'leverage',
  'excited to connect',
  'would love to',
  "i'd love to",
  'which is why i am reaching out',
  "which is why i'm reaching out",
] as const;

const PLACEHOLDER_RE = /\[[^\]]+\]|\{[^}]+\}|TODO|TBD|xxx|<[^>]+>/i;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function hasBannedPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some((p) => lower.includes(p));
}

export function hasPlaceholder(text: string): boolean {
  return PLACEHOLDER_RE.test(text);
}

export interface VariantLengthCheck {
  length_ok: boolean;
  subjectWords: number;
  openerWords: number;
  bridgeWords: number;
  comboWords: number;
  errors: string[];
}

/** Programmatic W4.5 length gate (matches prompt rules). */
export function validateVariantLength(
  subject: string,
  opener: string,
  bridge: string
): VariantLengthCheck {
  const subjectWords = countWords(subject);
  const openerWords = countWords(opener);
  const bridgeWords = countWords(bridge);
  const comboWords = openerWords + bridgeWords;
  const errors: string[] = [];

  if (subjectWords < 2 || subjectWords > 6) {
    errors.push(`subject: ${subjectWords} words (want 2–5)`);
  }
  if (openerWords > 35) {
    errors.push(`opener: ${openerWords} words (max 35)`);
  }
  if (bridgeWords > 30) {
    errors.push(`bridge: ${bridgeWords} words (max 30)`);
  }
  if (comboWords > 65) {
    errors.push(`opener+bridge: ${comboWords} words (max 65)`);
  }

  return {
    length_ok: errors.length === 0,
    subjectWords,
    openerWords,
    bridgeWords,
    comboWords,
    errors,
  };
}

export function validateVariantFields(subject: string, opener: string, bridge: string): string | null {
  if (!subject.trim() || !opener.trim() || !bridge.trim()) {
    return 'subject, opener, and bridge are required';
  }
  if (hasPlaceholder(subject) || hasPlaceholder(opener) || hasPlaceholder(bridge)) {
    return 'placeholder tokens detected';
  }
  if (hasBannedPhrase(subject) || hasBannedPhrase(opener) || hasBannedPhrase(bridge)) {
    return 'banned phrase detected';
  }
  return null;
}

export interface SignalBrief {
  research_summary: string;
  top_3_signals: unknown;
}

/** Heuristic: signal_used must overlap with brief content (not a fabrication check). */
export function checkSignalGrounding(signalUsed: string, brief: SignalBrief): boolean {
  const normalized = signalUsed.trim();
  if (!normalized || normalized.toUpperCase() === 'NONE') return true;

  const blob = `${brief.research_summary} ${JSON.stringify(brief.top_3_signals)}`.toLowerCase();
  const signalLower = normalized.toLowerCase();

  if (blob.includes(signalLower)) return true;

  const tokens = signalLower
    .split(/[\s,;:|/–—-]+/)
    .map((t) => t.replace(/[^a-z0-9']/gi, ''))
    .filter((t) => t.length > 3);

  if (tokens.length === 0) {
    const compact = signalLower.replace(/[^a-z0-9]/g, '');
    if (compact.length < 5) return true;
    return blob.includes(compact) || blob.includes(signalLower);
  }

  const matched = tokens.filter((t) => blob.includes(t)).length;
  const threshold = Math.max(1, Math.ceil(tokens.length * 0.4));
  return matched >= threshold;
}

/** Format top_3_signals for richer W4 prompts. */
export function formatSignalsForPrompt(top_3_signals: unknown): string {
  if (!top_3_signals) return '(no signals provided)';
  if (!Array.isArray(top_3_signals)) return JSON.stringify(top_3_signals, null, 2);

  if (top_3_signals.length === 0) return '(empty signal list — use NONE if nothing specific)';

  return top_3_signals
    .map((raw, i) => {
      const s = raw as Record<string, unknown>;
      const signal = String(s.signal ?? s.text ?? s.title ?? JSON.stringify(raw));
      const source = String(s.source ?? s.url ?? 'unknown source');
      const date = String(s.date ?? s.published_at ?? 'unknown date');
      return [
        `Signal ${i + 1}:`,
        `  Fact: ${signal}`,
        `  Source: ${source}`,
        `  Date: ${date}`,
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * Merge-field validation (Part 8).
 *
 * Dossier campaigns must use the researched custom opener — never a generic Apollo AI
 * opener — and no prospect may be enrolled with missing/empty/unsupported variables.
 * Pure functions, unit-testable.
 */

/** The only merge fields permitted in Dossier campaign templates. */
export const DOSSIER_ALLOWED_FIELDS = [
  'first_name',
  'company',
  'title',
  'research_signal',
  'personalized_opener',
  'bridge',
  'subject_line_a',
  'subject_line_b',
] as const;

/** Must be present + non-empty before a prospect can be enrolled. */
export const DOSSIER_REQUIRED_FIELDS = [
  'first_name',
  'company',
  'personalized_opener',
  'subject_line_a',
] as const;

export type DossierField = (typeof DOSSIER_ALLOWED_FIELDS)[number];

export interface MergeValidationResult {
  ok: boolean;
  missing: string[];
  empty: string[];
  unsupported: string[];
  errors: string[];
}

function isEmpty(v: unknown): boolean {
  return v == null || (typeof v === 'string' && v.trim() === '');
}

/** Validate the variable map that will be merged for one prospect. */
export function validateMergeFields(
  fields: Record<string, unknown>,
  required: readonly string[] = DOSSIER_REQUIRED_FIELDS,
  allowed: readonly string[] = DOSSIER_ALLOWED_FIELDS,
  ignore: readonly string[] = [],
): MergeValidationResult {
  const missing: string[] = [];
  const empty: string[] = [];
  const unsupported: string[] = [];

  for (const key of Object.keys(fields)) {
    if (!allowed.includes(key) && !ignore.includes(key)) unsupported.push(key);
  }
  for (const key of required) {
    if (!(key in fields)) missing.push(key);
    else if (isEmpty(fields[key])) empty.push(key);
  }

  const errors: string[] = [];
  if (missing.length) errors.push(`missing: ${missing.join(', ')}`);
  if (empty.length) errors.push(`empty: ${empty.join(', ')}`);
  if (unsupported.length) errors.push(`unsupported merge field(s): ${unsupported.join(', ')}`);

  return { ok: errors.length === 0, missing, empty, unsupported, errors };
}

/** Extract {{merge_fields}} referenced by a template body/subject. */
export function extractMergeFields(template: string): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) out.add(m[1]);
  return [...out];
}

/** A template may only reference allowed fields (Part 8: no unsupported merge fields sent). */
export function validateTemplateFields(
  template: string,
  allowed: readonly string[] = DOSSIER_ALLOWED_FIELDS,
): { ok: boolean; unsupported: string[] } {
  const unsupported = extractMergeFields(template).filter((f) => !allowed.includes(f));
  return { ok: unsupported.length === 0, unsupported };
}

export interface ProspectOpener {
  personalized_opener?: unknown;
  /** Provenance — required for every Dossier opener. */
  opener_source_url?: unknown;
  opener_research_id?: unknown;
  /** How the opener was produced; must NOT be a generic Apollo AI opener. */
  opener_source?: unknown;
}

const GENERIC_OPENER_SOURCES = new Set(['apollo_ai', 'apollo', 'generic_ai', 'ai_generated']);

/** True when the opener is a generic AI opener (disallowed for Dossier). */
export function isGenericApolloOpener(p: ProspectOpener): boolean {
  const src = typeof p.opener_source === 'string' ? p.opener_source.toLowerCase() : '';
  return GENERIC_OPENER_SOURCES.has(src);
}

/** The researched opener must exist and carry a traceable source (URL or research record). */
export function validateOpenerProvenance(p: ProspectOpener): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (isEmpty(p.personalized_opener)) errors.push('personalized_opener is empty');
  if (isGenericApolloOpener(p)) errors.push('generic Apollo AI opener is not allowed');
  if (isEmpty(p.opener_source_url) && isEmpty(p.opener_research_id)) {
    errors.push('opener missing a traceable source (opener_source_url or opener_research_id)');
  }
  return { ok: errors.length === 0, errors };
}

export interface CampaignProspect extends ProspectOpener {
  [key: string]: unknown;
}

/** Opener provenance metadata travels with a prospect but is not a sendable merge field. */
export const OPENER_META_FIELDS = ['opener_source', 'opener_source_url', 'opener_research_id'] as const;

/** Full gate before a prospect may be enrolled in a Dossier sequence. */
export function validateCampaignProspect(
  prospect: CampaignProspect,
  required: readonly string[] = DOSSIER_REQUIRED_FIELDS,
): { ok: boolean; errors: string[] } {
  const merge = validateMergeFields(prospect, required, DOSSIER_ALLOWED_FIELDS, OPENER_META_FIELDS);
  const opener = validateOpenerProvenance(prospect);
  return { ok: merge.ok && opener.ok, errors: [...merge.errors, ...opener.errors] };
}

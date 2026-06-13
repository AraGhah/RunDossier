// Replaces em-dashes and en-dashes with a plain hyphen-space pattern.
// Claude sometimes outputs "—" which breaks downstream CSV parsers and
// copy-paste into outreach tools that don't handle Unicode punctuation.
export function stripEmdash(text: string): string {
  return text
    .replace(/—/g, ' - ') // em dash
    .replace(/–/g, ' - ') // en dash
    .trim();
}

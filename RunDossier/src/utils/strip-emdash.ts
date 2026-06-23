/**
 * Remove dashes used as punctuation from model output.
 *
 * House style + cold-email best practice: no em-dashes, en-dashes, or spaced
 * hyphens. They read as AI filler and the prior version actually *kept* a dash
 * (it turned "—" into " - "). This replaces dash-punctuation with a comma while
 * preserving hyphens inside words ("data-driven", "co-founder", "70+/month"),
 * which have no surrounding whitespace.
 */
export function stripEmDashes(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ', ')      // em / en dash (optionally spaced) -> comma
    .replace(/\s+-\s+/g, ', ')          // spaced hyphen used as a dash -> comma
    .replace(/\s*,(\s*,)+/g, ',')       // collapse accidental ", ," runs
    .replace(/\s+([,.!?;:])/g, '$1')    // no space before punctuation
    .replace(/\s{2,}/g, ' ')            // collapse double spaces
    .replace(/^[\s,]+|[\s,]+$/g, '')    // trim leading/trailing space or comma
    .trim();
}

export function stripEmDashes(text: string): string {
  return text.replace(/—/g, ' - ').replace(/\s{2,}/g, ' ').trim();
}

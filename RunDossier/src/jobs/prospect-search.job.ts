import { runAllEnabledSearches } from '../services/prospect-search.js';

export async function runProspectSearchJob(): Promise<void> {
  const results = await runAllEnabledSearches();
  const total = results.reduce((sum, r) => sum + r.ingested, 0);
  console.log(`[prospect-search] completed ${results.length} profile(s), ${total} ingested`);
}

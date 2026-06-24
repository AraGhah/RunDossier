#!/usr/bin/env tsx
/**
 * Pre-flight intake — filter prospects already in DB before batch ingest.
 *
 *   npm exec tsx scripts/preflight-intake.ts scripts/prospects-batch.json
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { pool, query } from '../src/db.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';
import { validateConfig } from '../src/config.js';

async function main(): Promise<void> {
  validateConfig();
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: preflight-intake.ts <prospects.json>');
    process.exit(1);
  }

  const batch = JSON.parse(readFileSync(file, 'utf8')) as Array<{
    name: string;
    linkedin_url: string;
    email?: string;
    company?: string;
  }>;

  const urls = batch.map((b) => b.linkedin_url).filter(Boolean);
  const existing = await query<{ linkedin_url: string; status: string }>(
    `SELECT linkedin_url, status FROM prospects
     WHERE client_id = $1 AND linkedin_url = ANY($2::text[])`,
    [DEFAULT_CLIENT_ID, urls]
  );
  const existingSet = new Map(existing.map((r) => [r.linkedin_url, r.status]));

  const fresh = batch.filter((p) => !existingSet.has(p.linkedin_url));
  const dupes = batch.filter((p) => existingSet.has(p.linkedin_url));

  console.log(JSON.stringify({
    file,
    total: batch.length,
    fresh: fresh.length,
    duplicates: dupes.length,
    duplicate_breakdown: Object.fromEntries(
      [...dupes.reduce((m, p) => {
        const st = existingSet.get(p.linkedin_url) ?? 'unknown';
        m.set(st, (m.get(st) ?? 0) + 1);
        return m;
      }, new Map<string, number>())]
    ),
    recommendation:
      fresh.length === 0
        ? 'Ne pas ré-ingérer ce fichier — tous les prospects existent déjà. Utilisez W1 sourcing ou une nouvelle liste.'
        : `${fresh.length} prospect(s) prêts à ingérer.`,
  }, null, 2));

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

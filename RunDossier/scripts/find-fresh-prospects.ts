#!/usr/bin/env tsx
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pool, query, queryOne } from '../src/db.js';
import { DEFAULT_CLIENT_ID } from '../src/services/intake.js';

async function main(): Promise<void> {
  const queued = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM prospects
      WHERE client_id = $1 AND parent_batch_id IS NULL AND status = 'queued'`,
    [DEFAULT_CLIENT_ID]
  );
  const researchable = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM prospects
      WHERE client_id = $1 AND parent_batch_id IS NULL
        AND status IN ('queued','research_failed','qa_failed','personalization_failed')`,
    [DEFAULT_CLIENT_ID]
  );

  const scriptsDir = join(process.cwd(), 'scripts');
  const files = readdirSync(scriptsDir).filter((f) => f.startsWith('prospects') && f.endsWith('.json'));
  const availability: Array<{ file: string; total: number; newLinkedin: number }> = [];

  for (const file of files) {
    const rows = JSON.parse(readFileSync(join(scriptsDir, file), 'utf8')) as Array<{ linkedin_url?: string }>;
    const urls = rows.map((r) => r.linkedin_url).filter(Boolean) as string[];
    if (urls.length === 0) continue;
    const existing = await query<{ linkedin_url: string }>(
      `SELECT linkedin_url FROM prospects WHERE client_id = $1 AND linkedin_url = ANY($2::text[])`,
      [DEFAULT_CLIENT_ID, urls]
    );
    const existingSet = new Set(existing.map((e) => e.linkedin_url.toLowerCase()));
    const newCount = urls.filter((u) => !existingSet.has(u.toLowerCase())).length;
    availability.push({ file, total: urls.length, newLinkedin: newCount });
  }

  console.log(JSON.stringify({ queued_no_parent: queued?.c ?? 0, researchable_no_parent: researchable?.c ?? 0, files: availability }, null, 2));
  await pool.end();
}
void main();

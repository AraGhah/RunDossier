/**
 * Export dogfood Smartlead review queue for manual QA.
 * Usage: npx tsx scripts/dogfood-review-queue.ts [--json]
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

async function main(): Promise<void> {
  validateConfig();
  const asJson = process.argv.includes('--json');

  const rows = await query<{
    queue_id: string;
    name: string;
    title: string;
    linkedin_url: string;
    subject: string;
    opener: string;
    bridge: string;
    icp_fit_score: number;
    confidence_score: number;
    composite_score: number;
    queue_status: string;
    created_at: string;
  }>(
    `SELECT sq.id AS queue_id, p.name, COALESCE(p.title, '') AS title, p.linkedin_url,
            sq.subject, sq.opener, sq.bridge,
            sq.icp_fit_score, sq.confidence_score, sq.composite_score,
            sq.status AS queue_status, sq.created_at::text
     FROM smartlead_queue sq
     JOIN prospects p ON p.id = sq.prospect_id
     WHERE sq.status IN ('queued', 'failed')
     ORDER BY sq.composite_score DESC NULLS LAST, sq.created_at DESC`
  );

  if (asJson) {
    const path = 'dogfood-review-queue.json';
    writeFileSync(path, JSON.stringify(rows, null, 2), 'utf8');
    console.log(`Écrit ${rows.length} prospect(s) → ${path}`);
  } else {
    console.log(`\n=== Dogfood review queue (${rows.length}) ===\n`);
    for (const r of rows) {
      console.log(`— ${r.name} | ${r.title}`);
      console.log(`  LinkedIn: ${r.linkedin_url}`);
      console.log(`  Scores: ICP ${r.icp_fit_score} / conf ${r.confidence_score} / composite ${r.composite_score}`);
      console.log(`  Subject: ${r.subject}`);
      console.log(`  Opener: ${r.opener}`);
      console.log(`  Bridge: ${r.bridge}`);
      console.log(`  Status: ${r.queue_status}\n`);
    }
  }

  const funnel = await query<{ stage: string; count: string }>(
    `SELECT stage, COUNT(*)::text AS count
     FROM dogfood_funnel_events
     GROUP BY stage ORDER BY stage`
  ).catch(() => []);

  if (funnel.length > 0) {
    console.log('Funnel (all time):');
    for (const f of funnel) console.log(`  ${f.stage}: ${f.count}`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

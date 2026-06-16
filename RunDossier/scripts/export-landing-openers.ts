/**
 * Pull top QA openers for landing page copy (anonymize names).
 * Usage: npx tsx scripts/export-landing-openers.ts
 */
import 'dotenv/config';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { SHIPPED_LINE_STATUSES } from '../src/utils/first-line-status.js';

function anonymize(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'Prospect';
  return `${parts[0][0]}. — ${parts.length > 1 ? parts[parts.length - 1][0] + '.' : 'anon'}`;
}

async function main(): Promise<void> {
  validateConfig();

  const rows = await query<{
    name: string;
    title: string;
    opener: string;
    qa_score: number;
  }>(
    `SELECT p.name, COALESCE(p.title, '') AS title, fl.opener, fl.qa_score
     FROM first_lines fl
     JOIN prospects p ON p.id = fl.prospect_id
     WHERE fl.status IN (${SHIPPED_LINE_STATUSES.map(s => `'${s}'`).join(', ')})
     ORDER BY fl.is_chosen DESC NULLS LAST, fl.qa_score DESC NULLS LAST, fl.variant_number ASC
     LIMIT 3`
  );

  if (rows.length === 0) {
    console.log('Aucune opener ready en base.');
    await pool.end();
    return;
  }

  console.log('\n--- Copy/paste for landing/index.html ---\n');
  for (const r of rows) {
    console.log(`<blockquote class="example">`);
    console.log(`  ${r.opener}`);
    console.log(`  <cite>— ${anonymize(r.name)}, ${r.title || 'outbound leader'}</cite>`);
    console.log(`</blockquote>\n`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

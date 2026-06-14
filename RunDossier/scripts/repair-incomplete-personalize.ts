/**
 * Relance la personnalisation pour les prospects sans ligne livrable (W4/W4.5).
 * Usage: npx tsx scripts/repair-incomplete-personalize.ts
 */
import 'dotenv/config';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { handlePersonalize } from '../src/jobs/personalize.job.js';
import { countShippedLinesSql, SHIPPED_LINE_STATUSES } from '../src/utils/first-line-status.js';

async function main(): Promise<void> {
  validateConfig();

  const incomplete = await query<{ id: string; name: string; shipped: string }>(
    `SELECT p.id, p.name, ${countShippedLinesSql('fl')}::text AS shipped
     FROM prospects p
     LEFT JOIN first_lines fl ON fl.prospect_id = p.id
     WHERE p.status IN ('personalized_qa_passed', 'research_complete', 'qa_failed')
     GROUP BY p.id, p.name
     HAVING ${countShippedLinesSql('fl')} < 1
     ORDER BY p.name`
  );

  if (incomplete.length === 0) {
    console.log('Tous les prospects actifs ont au moins une ligne shipped.');
    await pool.end();
    return;
  }

  console.log(`Relance personnalisation pour ${incomplete.length} prospect(s):`);
  for (const p of incomplete) {
    console.log(`  - ${p.name} (${p.shipped} shipped)`);
    await query(
      `UPDATE prospects SET status = 'research_complete' WHERE id = $1`,
      [p.id]
    );
    await handlePersonalize({ data: { prospectId: p.id } });
    const [after] = await query<{ shipped: string; chosen: string }>(
      `SELECT ${countShippedLinesSql()}::text AS shipped,
              COUNT(*) FILTER (WHERE is_chosen = true)::text AS chosen
       FROM first_lines WHERE prospect_id = $1`,
      [p.id]
    );
    console.log(`    → ${after?.shipped ?? '0'} shipped, ${after?.chosen ?? '0'} chosen`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

/**
 * Relance la personnalisation pour les prospects sans 3/3 variantes ready.
 * Usage: npx tsx scripts/repair-incomplete-personalize.ts
 */
import 'dotenv/config';
import { query, pool } from '../src/db.js';
import { validateConfig, config } from '../src/config.js';
import { handlePersonalize } from '../src/jobs/personalize.job.js';

async function main(): Promise<void> {
  validateConfig();

  const incomplete = await query<{ id: string; name: string; ready: string }>(
    `SELECT p.id, p.name,
            COUNT(*) FILTER (WHERE fl.status = 'ready')::text AS ready
     FROM prospects p
     LEFT JOIN first_lines fl ON fl.prospect_id = p.id
     GROUP BY p.id, p.name
     HAVING COUNT(*) FILTER (WHERE fl.status = 'ready') < $1
     ORDER BY p.name`,
    [config.variantCount]
  );

  if (incomplete.length === 0) {
    console.log(`Tous les prospects ont déjà ${config.variantCount}/${config.variantCount} lignes ready.`);
    await pool.end();
    return;
  }

  console.log(`Relance personnalisation pour ${incomplete.length} prospect(s):`);
  for (const p of incomplete) {
    console.log(`  - ${p.name} (${p.ready}/${config.variantCount} ready)`);
    await query(
      `UPDATE prospects SET status = 'research_complete' WHERE id = $1`,
      [p.id]
    );
    await handlePersonalize({ data: { prospectId: p.id } });
    const [after] = await query<{ ready: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'ready')::text AS ready
       FROM first_lines WHERE prospect_id = $1`,
      [p.id]
    );
    console.log(`    → ${after?.ready ?? '0'}/${config.variantCount} ready`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

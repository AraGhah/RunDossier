/**
 * Remet en file les prospects bloqués en research_failed ou research_in_progress.
 * Usage: npx tsx scripts/requeue-research.ts
 */
import 'dotenv/config';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

async function main(): Promise<void> {
  validateConfig();

  const stuck = await query<{ id: string; name: string; status: string }>(
    `SELECT id, name, status FROM prospects
     WHERE status IN ('research_failed', 'research_in_progress')
     ORDER BY name`
  );

  if (stuck.length === 0) {
    console.log('Aucun prospect à relancer.');
    await pool.end();
    return;
  }

  console.log(`Relance research pour ${stuck.length} prospect(s):\n`);
  for (const p of stuck) {
    await query(
      `UPDATE prospects SET status = 'queued' WHERE id = $1`,
      [p.id]
    );
    console.log(`  ${p.name}: ${p.status} → queued`);
  }

  console.log('\nLe scheduler (toutes les 5 min) reprendra si le service tourne.');
  console.log('Assurez-vous d’avoir approuvé l’actor Apify LinkedIn avant de relancer.');
  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

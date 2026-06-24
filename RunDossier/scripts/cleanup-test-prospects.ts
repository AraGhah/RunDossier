#!/usr/bin/env tsx
/**
 * Stop pipeline noise from synthetic E2E/Audit/Rollout prospects.
 *
 *   npm exec tsx scripts/cleanup-test-prospects.ts
 *   npm exec tsx scripts/cleanup-test-prospects.ts --dry-run
 */
import 'dotenv/config';
import { pool, query } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { assessPersonalizeGate } from '../src/utils/personalize-gate.js';

const DRY_RUN = process.argv.includes('--dry-run');

const TEST_NAME_PATTERNS = ['E2E Test %', 'Audit %', 'Rollout %'];

const PIPELINE_STATUSES = [
  'queued',
  'research_in_progress',
  'research_complete',
  'research_failed',
  'personalization_in_progress',
  'personalization_failed',
  'qa_failed',
  'personalized_qa_passed',
];

async function main(): Promise<void> {
  validateConfig();

  const prospects = await query<{
    id: string;
    name: string;
    status: string;
    research_summary: string | null;
    top_3_signals: unknown;
    confidence_score: number | null;
  }>(
    `SELECT id, name, status, research_summary, top_3_signals, confidence_score
     FROM prospects
     WHERE (${TEST_NAME_PATTERNS.map((_, i) => `name LIKE $${i + 1}`).join(' OR ')})
       AND status = ANY($${TEST_NAME_PATTERNS.length + 1}::text[])
     ORDER BY name`,
    [...TEST_NAME_PATTERNS, PIPELINE_STATUSES]
  );

  if (prospects.length === 0) {
    console.log('Aucun prospect de test actif dans le pipeline.');
    await pool.end();
    return;
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}${prospects.length} prospect(s) de test à nettoyer:`);

  const ids: string[] = [];
  for (const p of prospects) {
    const gate = assessPersonalizeGate({
      research_summary: p.research_summary,
      top_3_signals: p.top_3_signals,
      confidence_score: p.confidence_score,
    });
    const target = gate.ok ? 'dead_letter' : 'thin_research';
    console.log(`  ${p.name} (${p.status}) → ${target}`);
    ids.push(p.id);
    if (!DRY_RUN) {
      await query(`UPDATE prospects SET status = $2, updated_at = NOW() WHERE id = $1`, [
        p.id,
        target,
      ]);
    }
  }

  if (!DRY_RUN && ids.length > 0) {
    const cancelled = await query<{ count: string }>(
      `WITH deleted AS (
         DELETE FROM pgboss.job
         WHERE name IN ('personalize', 'research')
           AND (data->>'prospectId')::uuid = ANY($1::uuid[])
         RETURNING 1
       )
       SELECT COUNT(*)::text AS count FROM deleted`,
      [ids]
    ).catch(() => [{ count: '0' }]);
    console.log(`Jobs pg-boss annulés: ${cancelled[0]?.count ?? 0}`);
  }

  await pool.end();
  console.log('Nettoyage terminé.');
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

/**
 * Rescue prospects stuck in dead_letter by promoting their best stored first_line
 * variant to qa_passed (lowered threshold).
 *
 * Dead-letter means the full model ladder ran but no variant hit QA≥7. The
 * variants are already persisted in first_lines — this script picks the best
 * one per prospect and marks it accepted so the delivery job can run.
 *
 * Dry-run by default. Pass --apply to commit changes.
 *
 * Usage:
 *   npx tsx scripts/rescue-dead-letter.ts            # dry-run
 *   npx tsx scripts/rescue-dead-letter.ts --apply    # commit
 *   MIN_RESCUE_SCORE=5 npx tsx scripts/rescue-dead-letter.ts --apply
 */
import 'dotenv/config';
import { query, pool } from '../src/db.js';
import { validateConfig } from '../src/config.js';

const APPLY = process.argv.includes('--apply');
const MIN_RESCUE_SCORE = parseInt(process.env.MIN_RESCUE_SCORE ?? '5', 10) || 5;

interface BestLine {
  prospect_id: string;
  prospect_name: string;
  line_id: string;
  variant_number: number;
  qa_score: number;
  subject: string;
  opener: string;
}

async function main(): Promise<void> {
  validateConfig();

  console.log(`\n=== rescue-dead-letter ===`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Min rescue score: ${MIN_RESCUE_SCORE}/10\n`);

  // Find the best stored first_line per dead_letter prospect.
  const candidates = await query<BestLine>(
    `SELECT
       p.id AS prospect_id,
       p.name AS prospect_name,
       fl.id AS line_id,
       fl.variant_number,
       fl.qa_score,
       fl.subject,
       fl.opener
     FROM prospects p
     JOIN LATERAL (
       SELECT fl2.id, fl2.variant_number, fl2.qa_score, fl2.subject, fl2.opener
       FROM first_lines fl2
       WHERE fl2.prospect_id = p.id
         AND fl2.qa_score >= $1
         AND fl2.subject IS NOT NULL AND trim(fl2.subject) <> ''
         AND fl2.opener IS NOT NULL AND trim(fl2.opener) <> ''
       ORDER BY fl2.qa_score DESC, fl2.variant_number ASC
       LIMIT 1
     ) fl ON true
     WHERE p.status = 'dead_letter'
     ORDER BY fl.qa_score DESC, p.name`
  , [MIN_RESCUE_SCORE]);

  const noLine = await query<{ id: string; name: string }>(
    `SELECT id, name FROM prospects p
     WHERE p.status = 'dead_letter'
       AND NOT EXISTS (
         SELECT 1 FROM first_lines fl
         WHERE fl.prospect_id = p.id AND fl.qa_score >= $1
           AND trim(coalesce(fl.subject,'')) <> ''
           AND trim(coalesce(fl.opener,'')) <> ''
       )
     ORDER BY name`
  , [MIN_RESCUE_SCORE]);

  console.log(`Dead-letter prospects with rescuable variant (score ≥ ${MIN_RESCUE_SCORE}): ${candidates.length}`);
  console.log(`Dead-letter prospects with NO rescuable variant: ${noLine.length}\n`);

  if (candidates.length === 0) {
    console.log('Nothing to rescue at this threshold. Lower MIN_RESCUE_SCORE and retry.');
    await pool.end();
    return;
  }

  for (const c of candidates) {
    console.log(`  ${c.prospect_name} — variant ${c.variant_number}, score ${c.qa_score}/10`);
    console.log(`    Subject: ${c.subject}`);
    console.log(`    Opener:  ${c.opener.slice(0, 80)}...`);

    if (APPLY) {
      // Clear any existing is_chosen flags for this prospect.
      await query(
        `UPDATE first_lines SET is_chosen = false WHERE prospect_id = $1`,
        [c.prospect_id]
      );
      // Promote this variant.
      await query(
        `UPDATE first_lines
         SET status = 'qa_passed', is_chosen = true, updated_at = NOW()
         WHERE id = $1`,
        [c.line_id]
      );
      // Re-open the prospect for delivery.
      await query(
        `UPDATE prospects
         SET status = 'personalized_qa_passed', updated_at = NOW()
         WHERE id = $1 AND status = 'dead_letter'`,
        [c.prospect_id]
      );
    }
  }

  if (APPLY) {
    console.log(`\n✓ Rescued ${candidates.length} prospects → personalized_qa_passed`);
    console.log(`  The delivery job will pick them up on the next cycle.`);
    if (noLine.length > 0) {
      console.log(`\n${noLine.length} prospects had no stored variant with score ≥ ${MIN_RESCUE_SCORE} — skipped.`);
      console.log('  To include them, lower MIN_RESCUE_SCORE or re-run personalization.');
    }
  } else {
    console.log(`\nDry-run complete. Run with --apply to commit.`);
  }

  await pool.end();
}

void main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

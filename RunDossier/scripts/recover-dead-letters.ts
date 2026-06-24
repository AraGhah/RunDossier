/**
 * Recover prospects that were dead-lettered by a TRANSIENT provider outage
 * (e.g. depleted Gemini credits) and put them back into the pipeline so they
 * re-personalize.
 *
 * SAFE + IDEMPOTENT: only flips rows currently in 'dead_letter' to a retryable
 * status. Re-running does nothing once they have moved on. Dry-run by default.
 *
 * ORDER OF OPERATIONS — do these FIRST, or recovered prospects just fail again:
 *   1. Restore Google AI (Gemini) credits.
 *   2. Configure an email provider (or DELIVERY_CSV_ONLY=true).
 *   3. Deploy the provider-outage fix:  npm run build  + restart the worker.
 *   Then run this with --apply.
 *
 * Usage:
 *   tsx scripts/recover-dead-letters.ts                          # dry-run, outage-signature only
 *   tsx scripts/recover-dead-letters.ts --since=2026-06-24       # scope to recent dead-letters (recommended)
 *   tsx scripts/recover-dead-letters.ts --since=2026-06-24 --apply
 *   tsx scripts/recover-dead-letters.ts --client=<uuid> --limit=500 --apply
 *   tsx scripts/recover-dead-letters.ts --all --since=2026-06-24 --apply   # reset ALL dead-letters in window
 *   tsx scripts/recover-dead-letters.ts --reset-to=queued --apply          # also re-run research (W3)
 */
import { pool } from '../src/db.js';
import { classifyProviderError } from '../src/utils/provider-error.js';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? 'true' : hit.slice(eq + 1);
}

const APPLY = arg('apply') !== undefined;
const ALL = arg('all') !== undefined;
const SINCE = arg('since');
const CLIENT = arg('client');
const LIMIT = Math.max(1, Math.min(20000, Number(arg('limit') ?? '5000') || 5000));
const RESET_TO = (arg('reset-to') ?? 'research_complete') as 'research_complete' | 'queued';

if (RESET_TO !== 'research_complete' && RESET_TO !== 'queued') {
  throw new Error("--reset-to must be 'research_complete' or 'queued'");
}

interface DeadRow {
  id: string;
  client_id: string | null;
  last_error: string | null;
  has_outage_error: boolean;
}

/** The dead-letter reason itself rarely names the provider; the QA judge simply scores 0/10. */
function looksOutageCaused(row: DeadRow): boolean {
  if (row.has_outage_error) return true;
  const e = row.last_error ?? '';
  if (classifyProviderError(e) === 'transient') return true;
  if (/best QA 0\/10/i.test(e)) return true; // QA produced no real score across the whole ladder
  return false;
}

async function main(): Promise<void> {
  const conds: string[] = [`p.status = 'dead_letter'`];
  const params: unknown[] = [];
  if (SINCE) {
    params.push(SINCE);
    conds.push(`p.updated_at >= $${params.length}::timestamptz`);
  }
  if (CLIENT) {
    params.push(CLIENT);
    conds.push(`p.client_id = $${params.length}::uuid`);
  }
  params.push(LIMIT);

  const { rows } = await pool.query<DeadRow>(
    `SELECT p.id, p.client_id,
            (SELECT fj.error FROM failed_jobs fj
              WHERE fj.entity_id = p.id::text
                AND fj.workflow LIKE 'personalize%'
              ORDER BY fj.created_at DESC LIMIT 1) AS last_error,
            EXISTS (
              SELECT 1 FROM failed_jobs fj
               WHERE fj.entity_id = p.id::text
                 AND fj.workflow LIKE 'personalize%'
                 AND (fj.error ILIKE '%credits are depleted%'
                   OR fj.error ILIKE '%prepayment%'
                   OR fj.error ILIKE '%resource_exhausted%'
                   OR fj.error ILIKE '%quota%'
                   OR fj.error ILIKE '%rate limit%'
                   OR fj.error ILIKE '%overloaded%'
                   OR fj.error ~ '\\m(429|500|502|503)\\M')
            ) AS has_outage_error
       FROM prospects p
      WHERE ${conds.join(' AND ')}
      ORDER BY p.updated_at DESC
      LIMIT $${params.length}`,
    params
  );

  const candidates = rows.filter((r) => ALL || looksOutageCaused(r));

  console.log(
    `[recover] dead_letter scanned: ${rows.length} | matched (${ALL ? 'ALL in window' : 'provider-outage signature'}): ${candidates.length}`
  );

  if (candidates.length === 0) {
    console.log('[recover] nothing to recover with the current filter. Try --since=<outage start> or --all.');
    await pool.end();
    return;
  }

  if (!APPLY) {
    console.log(`[recover] DRY-RUN — no changes. Re-run with --apply to reset these to '${RESET_TO}'.`);
    for (const c of candidates.slice(0, 5)) {
      console.log(`  ${c.id} :: ${(c.last_error ?? '(no error logged)').replace(/\s+/g, ' ').slice(0, 90)}`);
    }
    if (candidates.length > 5) console.log(`  …and ${candidates.length - 5} more`);
    await pool.end();
    return;
  }

  const ids = candidates.map((c) => c.id);
  const res = await pool.query(
    `UPDATE prospects SET status = $2, updated_at = NOW()
      WHERE id = ANY($1::uuid[]) AND status = 'dead_letter'`,
    [ids, RESET_TO]
  );
  await pool.query(
    `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
     SELECT 'dead-letter-recovery', id::text,
            $2, 0
       FROM unnest($1::uuid[]) AS t(id)`,
    [ids, `recovered dead_letter -> ${RESET_TO} (${ALL ? 'manual --all' : 'provider-outage signature'})`]
  ).catch((e) => console.error('[recover] audit insert warning:', (e as Error).message));

  console.log(
    `[recover] reset ${res.rowCount} prospect(s) dead_letter -> ${RESET_TO}. ` +
      `The scheduler will re-process them in chunks (research → personalize → QA → delivery).`
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error('[recover] error:', err);
  await pool.end().catch(() => {});
  process.exit(1);
});

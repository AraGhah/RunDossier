import { query } from '../db.js';
import { getBoss } from '../queue.js';
import { config } from '../config.js';
import { prospectHasShippedLineSql } from '../utils/first-line-status.js';
import { reapStaleWorkflowRuns } from '../services/workflow-run.js';
import { shouldSchedulerRetryResearch } from '../utils/research-retry.js';
import { shouldSchedulerRetryPersonalize } from '../utils/personalize-retry.js';
import { assessPersonalizeGate } from '../utils/personalize-gate.js';
import { listActiveParentBatches } from '../services/parent-batch.js';

async function enqueueResearch(prospectId: string): Promise<void> {
  const boss = getBoss();
  try {
    await boss.send('research', { prospectId }, { singletonKey: `research-${prospectId}` });
  } catch (err) {
    await query(
      `UPDATE prospects SET status = 'queued'
       WHERE id = $1 AND status = 'research_in_progress'`,
      [prospectId]
    );
    throw err;
  }
}

async function enqueuePersonalize(prospectId: string): Promise<void> {
  const boss = getBoss();
  try {
    await boss.send('personalize', { prospectId }, { singletonKey: `personalize-${prospectId}` });
  } catch (err) {
    await query(
      `UPDATE prospects SET status = 'research_complete'
       WHERE id = $1 AND status = 'personalization_in_progress'`,
      [prospectId]
    );
    throw err;
  }
}

export async function runScheduler(): Promise<void> {
  await reapStaleWorkflowRuns().catch((e) =>
    console.warn('[scheduler] stale workflow run reap:', (e as Error).message)
  );

  const activeParents = await listActiveParentBatches();
  const parentBatchIds = activeParents.map((b) => b.id);

  // Process multiple internal chunks per tick when parent batches are active.
  const cycles = parentBatchIds.length > 0 ? config.schedulerCyclesPerTick : 1;

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    await runSchedulerCycle(parentBatchIds);
    if (parentBatchIds.length === 0) break;
  }
}

async function runSchedulerCycle(prioritizeParentBatchIds: string[]): Promise<void> {
  const { schedulerBatchSize } = config;

  const queued =
    prioritizeParentBatchIds.length > 0
      ? await query<{ id: string }>(
          `SELECT id FROM prospects
           WHERE status = 'queued'
             AND (parent_batch_id = ANY($2::uuid[]) OR parent_batch_id IS NULL)
           ORDER BY CASE WHEN parent_batch_id = ANY($2::uuid[]) THEN 0 ELSE 1 END, created_at
           LIMIT $1`,
          [schedulerBatchSize, prioritizeParentBatchIds]
        )
      : await query<{ id: string }>(
          `SELECT id FROM prospects WHERE status = 'queued' ORDER BY created_at LIMIT $1`,
          [schedulerBatchSize]
        );
  for (const p of queued) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_in_progress'
       WHERE id = $1 AND status = 'queued'
       RETURNING id`,
      [p.id]
    );
    if (claimed) await enqueueResearch(claimed.id);
  }

  const researched = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE status = 'research_complete'
       AND research_summary IS NOT NULL
       AND length(trim(research_summary)) >= 40
       AND top_3_signals IS NOT NULL
       AND top_3_signals::text NOT IN ('null', '[]')
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of researched) {
    await enqueuePersonalize(p.id);
  }

  const incomplete = await query<{ id: string }>(
    `SELECT p.id
     FROM prospects p
     WHERE p.status = 'personalized_qa_passed'
       AND NOT (${prospectHasShippedLineSql('p')})
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of incomplete) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_complete'
       WHERE id = $1 AND status = 'personalized_qa_passed'
       RETURNING id`,
      [p.id]
    );
    if (!claimed) continue;
    await enqueuePersonalize(claimed.id);
  }

  const researchRetry = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE status = 'research_failed'
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of researchRetry) {
    const [stats] = await query<{ count: string; latest_error: string | null }>(
      `SELECT
         (SELECT COUNT(*)::text FROM failed_jobs fj
          WHERE fj.entity_id = $1::text
            AND fj.workflow IN ('research', 'W3 - Research')) AS count,
         (SELECT error FROM failed_jobs fj
          WHERE fj.entity_id = $1::text
            AND fj.workflow IN ('research', 'W3 - Research')
          ORDER BY created_at DESC LIMIT 1) AS latest_error`,
      [p.id]
    );
    if (!shouldSchedulerRetryResearch(Number(stats?.count ?? 0), stats?.latest_error)) continue;

    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'queued'
       WHERE id = $1 AND status = 'research_failed'
       RETURNING id`,
      [p.id]
    );
    if (!claimed) continue;
    const [enqueued] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_in_progress'
       WHERE id = $1 AND status = 'queued'
       RETURNING id`,
      [claimed.id]
    );
    if (enqueued) await enqueueResearch(enqueued.id);
  }

  const qaRetry = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE status = 'qa_failed' LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of qaRetry) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_complete'
       WHERE id = $1 AND status = 'qa_failed'
       RETURNING id`,
      [p.id]
    );
    if (!claimed) continue;
    await enqueuePersonalize(claimed.id);
  }

  const personalizeRetry = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE status = 'personalization_failed' LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of personalizeRetry) {
    const [stats] = await query<{ count: string; dead: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM failed_jobs fj
          WHERE fj.entity_id = $1::text AND fj.workflow = 'personalize') AS count,
         (SELECT COUNT(*)::text FROM failed_jobs fj
          WHERE fj.entity_id = $1::text AND fj.workflow = 'personalize-dead-letter') AS dead`,
      [p.id]
    );
    if (!shouldSchedulerRetryPersonalize(Number(stats?.count ?? 0), Number(stats?.dead ?? 0) > 0)) {
      const terminal =
        Number(stats?.dead ?? 0) > 0 ? 'dead_letter' : 'thin_research';
      await query(`UPDATE prospects SET status = $2, updated_at = NOW() WHERE id = $1`, [
        p.id,
        terminal,
      ]);
      continue;
    }

    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_complete'
       WHERE id = $1 AND status = 'personalization_failed'
       RETURNING id`,
      [p.id]
    );
    if (!claimed) continue;
    await enqueuePersonalize(claimed.id);
  }

  const stuckResearch = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE status = 'research_in_progress'
       AND updated_at < NOW() - INTERVAL '10 minutes'
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of stuckResearch) {
    await enqueueResearch(p.id);
  }

  const stuckPersonalize = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE status = 'personalization_in_progress'
       AND updated_at < NOW() - INTERVAL '10 minutes'
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of stuckPersonalize) {
    const [row] = await query<{
      id: string;
      research_summary: string | null;
      top_3_signals: unknown;
      confidence_score: number | null;
    }>(
      `SELECT id, research_summary, top_3_signals, confidence_score
       FROM prospects WHERE id = $1`,
      [p.id]
    );
    if (!row) continue;

    const gate = assessPersonalizeGate({
      research_summary: row.research_summary,
      top_3_signals: row.top_3_signals,
      confidence_score: row.confidence_score,
    });
    if (!gate.ok) {
      await query(`UPDATE prospects SET status = 'thin_research', updated_at = NOW() WHERE id = $1`, [
        p.id,
      ]);
      continue;
    }

    await query(
      `UPDATE prospects SET status = 'research_complete', updated_at = NOW()
       WHERE id = $1 AND status = 'personalization_in_progress'`,
      [p.id]
    );
    await enqueuePersonalize(p.id);
  }

  // Reaper: stranded delivering prospects — exclude active parent-batch deliveries.
  await query(
    `UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW()
     WHERE status = 'delivering'
       AND updated_at < NOW() - INTERVAL '15 minutes'
       AND (
         parent_batch_id IS NULL
         OR NOT EXISTS (
           SELECT 1 FROM parent_batches pb
           WHERE pb.id = prospects.parent_batch_id
             AND pb.status = 'delivering'
             AND pb.updated_at >= NOW() - INTERVAL '20 minutes'
         )
       )`
  );
}

import { query } from '../db.js';
import { getBoss } from '../queue.js';
import { config } from '../config.js';
import { prospectHasShippedLineSql } from '../utils/first-line-status.js';
import { reapStaleWorkflowRuns } from '../services/workflow-run.js';
import { shouldSchedulerRetryResearch } from '../utils/research-retry.js';

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

  const { schedulerBatchSize } = config;

  const queued = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE status = 'queued' LIMIT $1`,
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
    `SELECT id FROM prospects WHERE status = 'research_complete' LIMIT $1`,
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
    await query(
      `UPDATE prospects SET status = 'research_complete', updated_at = NOW()
       WHERE id = $1 AND status = 'personalization_in_progress'`,
      [p.id]
    );
    await enqueuePersonalize(p.id);
  }

  // Reaper: a delivery that crashed mid-flight can leave prospects stranded in
  // 'delivering'. Hand any stuck for >15 min back to the ready pool so the next
  // delivery cycle retries them (a normal send completes in seconds).
  await query(
    `UPDATE prospects SET status = 'personalized_qa_passed', updated_at = NOW()
     WHERE status = 'delivering' AND updated_at < NOW() - INTERVAL '15 minutes'`
  );
}

import { query } from '../db.js';
import { getBoss } from '../queue.js';
import { config } from '../config.js';

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
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status = 'research_complete'
       RETURNING id`,
      [p.id]
    );
    if (claimed) await enqueuePersonalize(claimed.id);
  }

  const incomplete = await query<{ id: string }>(
    `SELECT p.id
     FROM prospects p
     WHERE trim(p.status) = 'personalized_qa_passed'
       AND (
         SELECT COUNT(*)::int
         FROM first_lines fl
         WHERE fl.prospect_id = p.id AND fl.status = 'ready'
       ) < $1
     LIMIT $2`,
    [config.variantCount, schedulerBatchSize]
  );
  for (const p of incomplete) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_complete'
       WHERE id = $1 AND trim(status) = 'personalized_qa_passed'
       RETURNING id`,
      [p.id]
    );
    if (!claimed) continue;
    const [enqueued] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status = 'research_complete'
       RETURNING id`,
      [claimed.id]
    );
    if (enqueued) await enqueuePersonalize(enqueued.id);
  }

  const researchRetry = await query<{ id: string }>(
    `SELECT id FROM prospects
     WHERE status = 'research_failed'
     LIMIT $1`,
    [schedulerBatchSize]
  );
  for (const p of researchRetry) {
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
}

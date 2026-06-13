import { query } from '../db.js';
import { getBoss } from '../queue.js';
import { config } from '../config.js';

async function enqueueResearch(prospectId: string): Promise<void> {
  const boss = getBoss();
  try {
    await boss.send('research', { prospectId }, { singletonKey: `research-${prospectId}` });
  } catch (err) {
    await query(
      `UPDATE prospects SET status = 'queued', updated_at = NOW()
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
      `UPDATE prospects SET status = 'research_complete', updated_at = NOW()
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
      `UPDATE prospects SET status = 'research_in_progress', updated_at = NOW()
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
      `UPDATE prospects SET status = 'personalization_in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'research_complete'
       RETURNING id`,
      [p.id]
    );
    if (claimed) await enqueuePersonalize(claimed.id);
  }
}

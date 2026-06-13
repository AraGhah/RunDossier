import { query } from '../db.js';
import { getBoss } from '../queue.js';

async function enqueueResearch(prospectId: string) {
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

async function enqueuePersonalize(prospectId: string) {
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

export async function runScheduler() {
  const queued = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE status = 'queued' LIMIT 50`
  );
  for (const p of queued) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'research_in_progress'
       WHERE id = $1 AND status = 'queued'
       RETURNING id`,
      [p.id]
    );
    if (claimed) {
      await enqueueResearch(claimed.id);
    }
  }

  const researched = await query<{ id: string }>(
    `SELECT id FROM prospects WHERE status = 'research_complete' LIMIT 50`
  );
  for (const p of researched) {
    const [claimed] = await query<{ id: string }>(
      `UPDATE prospects SET status = 'personalization_in_progress'
       WHERE id = $1 AND status = 'research_complete'
       RETURNING id`,
      [p.id]
    );
    if (claimed) {
      await enqueuePersonalize(claimed.id);
    }
  }
}

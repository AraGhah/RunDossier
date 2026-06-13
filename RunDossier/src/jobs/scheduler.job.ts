import PgBoss from 'pg-boss';
import { query } from '../db.js';
import { JOB_NAMES } from '../queue.js';

export async function registerSchedulerJob(boss: PgBoss): Promise<void> {
  await boss.schedule(JOB_NAMES.SCHEDULER, '*/15 * * * *', {});

  await boss.work(JOB_NAMES.SCHEDULER, async () => {
    const result = await query<{ id: string; linkedin_url: string }>(
      `SELECT id, linkedin_url FROM leads WHERE status = 'pending' LIMIT 20`
    );

    for (const lead of result.rows) {
      await boss.send(JOB_NAMES.RESEARCH, { leadId: lead.id, linkedinUrl: lead.linkedin_url });
      await query(`UPDATE leads SET status = 'queued' WHERE id = $1`, [lead.id]);
    }

    console.log(`[scheduler] Enqueued ${result.rows.length} leads for research`);
  });
}

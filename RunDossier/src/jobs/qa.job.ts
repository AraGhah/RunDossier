import PgBoss from 'pg-boss';
import { runQaAgent } from '../agents/qa.agent.js';
import { query } from '../db.js';
import { JOB_NAMES } from '../queue.js';

interface QaJobData {
  leadId: string;
  subject: string;
  emailBody: string;
  linkedinNote: string;
}

export async function registerQaJob(boss: PgBoss): Promise<void> {
  await boss.work<QaJobData>(JOB_NAMES.QA, async (job) => {
    const { leadId, subject, emailBody, linkedinNote } = job.data;

    const result = await runQaAgent({ leadId, subject, emailBody, linkedinNote });

    await query(
      `UPDATE leads SET qa_score = $1, qa_issues = $2, status = $3 WHERE id = $4`,
      [result.score, JSON.stringify(result.issues), result.passed ? 'approved' : 'qa_failed', leadId]
    );

    if (result.passed) {
      await boss.send(JOB_NAMES.DELIVERY, { leadId });
    }
  });
}

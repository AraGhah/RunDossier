import PgBoss from 'pg-boss';
import { runPersonalizeAgent } from '../agents/personalize.agent.js';
import { query } from '../db.js';
import { JOB_NAMES } from '../queue.js';

interface PersonalizeJobData {
  leadId: string;
  fullName: string;
  company: string;
  researchSummary: string;
  talkingPoints: string[];
}

export async function registerPersonalizeJob(boss: PgBoss): Promise<void> {
  await boss.work<PersonalizeJobData>(JOB_NAMES.PERSONALIZE, async (job) => {
    const { leadId, fullName, company, researchSummary, talkingPoints } = job.data;

    const copy = await runPersonalizeAgent({ leadId, fullName, company, researchSummary, talkingPoints });

    await query(
      `UPDATE leads SET
         email_subject = $1,
         email_body = $2,
         linkedin_note = $3,
         status = 'personalized'
       WHERE id = $4`,
      [copy.subject, copy.emailBody, copy.linkedinNote, leadId]
    );

    await boss.send(JOB_NAMES.QA, { leadId, ...copy });
  });
}

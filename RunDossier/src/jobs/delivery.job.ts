import PgBoss from 'pg-boss';
import { query } from '../db.js';
import { notify } from '../notify.js';
import { JOB_NAMES } from '../queue.js';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import os from 'os';

interface DeliveryJobData {
  leadId: string;
}

export async function registerDeliveryJob(boss: PgBoss): Promise<void> {
  await boss.work<DeliveryJobData>(JOB_NAMES.DELIVERY, async (job) => {
    const { leadId } = job.data;

    const result = await query<{
      full_name: string;
      company: string;
      linkedin_url: string;
      email_subject: string;
      email_body: string;
      linkedin_note: string;
    }>(
      `SELECT full_name, company, linkedin_url, email_subject, email_body, linkedin_note
       FROM leads WHERE id = $1`,
      [leadId]
    );

    const lead = result.rows[0];
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    const outPath = path.join(os.tmpdir(), `lead-${leadId}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: outPath,
      header: [
        { id: 'full_name', title: 'Full Name' },
        { id: 'company', title: 'Company' },
        { id: 'linkedin_url', title: 'LinkedIn URL' },
        { id: 'email_subject', title: 'Email Subject' },
        { id: 'email_body', title: 'Email Body' },
        { id: 'linkedin_note', title: 'LinkedIn Note' },
      ],
    });

    await csvWriter.writeRecords([lead]);
    await query(`UPDATE leads SET status = 'delivered', delivered_at = NOW() WHERE id = $1`, [leadId]);
    await notify(`Lead <b>${lead.full_name}</b> at ${lead.company} delivered. CSV: ${outPath}`);
  });
}

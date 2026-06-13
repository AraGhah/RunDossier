import PgBoss from 'pg-boss';
import { scrapeLinkedIn } from '../scrapers/linkedin.js';
import { runResearchAgent } from '../agents/research.agent.js';
import { query } from '../db.js';
import { JOB_NAMES } from '../queue.js';

interface ResearchJobData {
  leadId: string;
  linkedinUrl: string;
}

export async function registerResearchJob(boss: PgBoss): Promise<void> {
  await boss.work<ResearchJobData>(JOB_NAMES.RESEARCH, async (job) => {
    const { leadId, linkedinUrl } = job.data;

    const [profile] = await scrapeLinkedIn([linkedinUrl]);
    if (!profile) throw new Error(`No profile returned for ${linkedinUrl}`);

    const research = await runResearchAgent({
      leadId,
      fullName: profile.fullName,
      headline: profile.headline,
      company: profile.company,
      about: profile.about,
    });

    await query(
      `UPDATE leads SET
         research_summary = $1,
         key_insights = $2,
         talking_points = $3,
         status = 'researched'
       WHERE id = $4`,
      [research.summary, JSON.stringify(research.keyInsights), JSON.stringify(research.talkingPoints), leadId]
    );

    await boss.send(JOB_NAMES.PERSONALIZE, {
      leadId,
      fullName: profile.fullName,
      company: profile.company,
      researchSummary: research.summary,
      talkingPoints: research.talkingPoints,
    });
  });
}

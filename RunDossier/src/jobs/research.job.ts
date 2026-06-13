import { query } from '../db.js';
import { scrapeLinkedIn } from '../scrapers/linkedin.js';
import { searchPodcasts } from '../scrapers/podcast.js';
import { runResearchAgent } from '../agents/research.agent.js';
import { withRetry } from '../utils/retry.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';

export async function handleResearch(job: { data: { prospectId: string } }) {
  const { prospectId } = job.data;
  let prospect: Record<string, any> | undefined;

  try {
    [prospect] = await query<Record<string, any>>(
      `SELECT * FROM prospects WHERE id = $1 AND status = 'research_in_progress'`,
      [prospectId]
    );
    if (!prospect) return;

    const linkedinUrl = String(prospect.linkedin_url ?? '').trim();
    if (!linkedinUrl) {
      throw new Error(`Prospect ${prospectId} has no linkedin_url`);
    }

    const linkedInData = await withRetry(
      () => scrapeLinkedIn(linkedinUrl),
      config.maxRetries,
      'linkedin-scrape'
    );
    if (!linkedInData) {
      throw new Error(`No LinkedIn profile returned for ${linkedinUrl}`);
    }

    await query(
      `INSERT INTO prospect_signals_raw (prospect_id, source, raw_payload)
       VALUES ($1, 'linkedin', $2)`,
      [prospectId, JSON.stringify(linkedInData)]
    );

    const podcasts = await searchPodcasts(
      String(prospect.name ?? ''),
      (linkedInData as { company?: { name?: string } }).company?.name ?? ''
    );

    const systemPrompt = await loadActivePrompt(
      'research_agent',
      'You are a B2B prospect researcher. Analyze LinkedIn and podcast data to produce actionable sales intelligence. Return only valid JSON.'
    );
    const research = await runResearchAgent(prospectId, linkedInData, podcasts, systemPrompt);

    const status = research.confidence_score < config.confidenceFloor
      ? 'thin_research'
      : 'research_complete';

    await query(
      `UPDATE prospects
       SET research_summary = $1, top_3_signals = $2,
           confidence_score = $3, status = $4
       WHERE id = $5`,
      [
        research.research_summary,
        JSON.stringify(research.top_3_signals),
        research.confidence_score,
        status,
        prospectId,
      ]
    );

  } catch (err) {
    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('research', $1, $2, $3)`,
      [prospectId, (err as Error).message, config.maxRetries]
    ).catch(e => console.error('[research] failed_jobs insert error:', e));

    await query(
      `UPDATE prospects SET status = 'research_failed'
       WHERE id = $1 AND status = 'research_in_progress'`,
      [prospectId]
    ).catch(e => console.error('[research] status reset error:', e));

    await notify(`Research failed: ${prospect?.name ?? prospectId}\n${(err as Error).message}`);
    throw err;
  }
}

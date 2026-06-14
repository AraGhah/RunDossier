import { query } from '../db.js';
import { scrapeLinkedIn, extractCompanyName, linkedinScrapeShouldRetry } from '../scrapers/linkedin.js';
import { searchPodcasts } from '../scrapers/podcast.js';
import { runResearchAgent } from '../agents/research.agent.js';
import { withRetry } from '../utils/retry.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';
import { logFunnelEvent } from '../utils/funnel-log.js';

interface Prospect {
  id: string;
  name: string;
  linkedin_url: string;
  source?: string;
}

export async function handleResearch(job: { data: { prospectId: string } }): Promise<void> {
  const { prospectId } = job.data;
  let prospect: Prospect | undefined;

  try {
    [prospect] = await query<Prospect>(
      `SELECT id, name, linkedin_url, COALESCE(source, 'manual') AS source
       FROM prospects WHERE id = $1 AND status = 'research_in_progress'`,
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
      'linkedin-scrape',
      linkedinScrapeShouldRetry
    );
    if (!linkedInData) {
      throw new Error(`No LinkedIn profile returned for ${linkedinUrl}`);
    }

    await query(
      `INSERT INTO prospect_signals_raw (prospect_id, source, raw_payload)
       VALUES ($1, 'linkedin', $2)`,
      [prospectId, JSON.stringify(linkedInData)]
    );

    const linkedInRecord = linkedInData as Record<string, unknown>;
    const companyName = extractCompanyName(linkedInRecord);

    const podcasts = await searchPodcasts(prospect.name, companyName);

    const systemPrompt = await loadActivePrompt(
      'research_agent',
      'You are a B2B prospect researcher. Analyze LinkedIn and podcast data to produce actionable sales intelligence. Return only valid JSON.'
    );

    const research = await runResearchAgent(
      prospectId,
      linkedInRecord,
      podcasts,
      systemPrompt
    );

    const status =
      research.confidence_score < config.confidenceFloor
        ? 'thin_research'
        : 'research_complete';

    await query(
      `UPDATE prospects
       SET research_summary = $1, top_3_signals = $2,
           buying_triggers = $3, confidence_score = $4, status = $5,
           company = COALESCE(NULLIF(company, ''), $6)
       WHERE id = $7`,
      [
        research.research_summary,
        JSON.stringify(research.top_3_signals),
        JSON.stringify(research.buying_triggers ?? []),
        research.confidence_score,
        status,
        companyName || null,
        prospectId,
      ]
    );

    if (prospect.source === 'dogfood' && status === 'research_complete') {
      await logFunnelEvent(prospectId, 'researched', {
        confidence_score: research.confidence_score,
      });
    }

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

    await notify(
      `Research failed: ${prospect?.name ?? prospectId}\n${(err as Error).message}`
    );
    throw err;
  }
}

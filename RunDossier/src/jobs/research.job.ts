import { query } from '../db.js';
import { scrapeLinkedIn, extractCompanyName, linkedinScrapeShouldRetry } from '../scrapers/linkedin.js';
import {
  enrichPersonViaApollo,
  extractCompanyFromApollo,
  extractEmailFromApollo,
  extractTitleFromApollo,
} from '../scrapers/apollo.js';
import { searchPodcasts } from '../scrapers/podcast.js';
import { runResearchAgent } from '../agents/research.agent.js';
import { withRetry } from '../utils/retry.js';
import { notify } from '../notify.js';
import { config } from '../config.js';
import { loadActivePrompt } from '../utils/prompts.js';
import { logFunnelEvent } from '../utils/funnel-log.js';
import { evaluateResearchQuality } from '../utils/research-quality.js';
import { formatApifyFailureForDb } from '../utils/apify-failure-log.js';
import { ApifyScrapeError } from '../utils/apify-error.js';

interface Prospect {
  id: string;
  name: string;
  linkedin_url: string;
  email: string | null;
  title: string | null;
  company: string | null;
  source?: string;
}

export async function handleResearch(job: { data: { prospectId: string } }): Promise<void> {
  const { prospectId } = job.data;
  let prospect: Prospect | undefined;

  try {
    [prospect] = await query<Prospect>(
      `SELECT id, name, linkedin_url, email, title, company,
              COALESCE(source, 'manual') AS source
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

    let apolloData: Record<string, unknown> | null = null;
    if (config.apolloEnabled && config.apolloApiKey) {
      try {
        apolloData = await enrichPersonViaApollo({
          linkedinUrl,
          name: prospect.name,
          email: prospect.email ?? undefined,
          title: prospect.title ?? undefined,
          company: prospect.company ?? undefined,
        });

        if (apolloData) {
          await query(
            `INSERT INTO prospect_signals_raw (prospect_id, source, raw_payload)
             VALUES ($1, 'apollo', $2)`,
            [prospectId, JSON.stringify(apolloData)]
          );

          const apolloEmail = extractEmailFromApollo(apolloData);
          const apolloTitle = extractTitleFromApollo(apolloData);
          const apolloCompany = extractCompanyFromApollo(apolloData);

          await query(
            `UPDATE prospects
             SET email = COALESCE(NULLIF(TRIM(email), ''), $1),
                 title = COALESCE(NULLIF(TRIM(title), ''), $2),
                 company = COALESCE(NULLIF(TRIM(company), ''), $3)
             WHERE id = $4`,
            [apolloEmail, apolloTitle, apolloCompany || null, prospectId]
          );
        }
      } catch (apolloErr) {
        console.warn(`[research] Apollo enrich skipped for ${prospectId}:`, (apolloErr as Error).message);
      }
    }

    const companyName =
      extractCompanyName(linkedInRecord) ||
      (apolloData ? extractCompanyFromApollo(apolloData) : '') ||
      prospect.company ||
      '';

    const podcasts = await searchPodcasts(prospect.name, companyName);

    const systemPrompt = await loadActivePrompt(
      'research_agent',
      'You are a B2B research analyst. Analyze LinkedIn, Apollo enrichment, and podcast data to produce actionable sales intelligence. Return only valid JSON.'
    );

    const research = await runResearchAgent(
      prospectId,
      linkedInRecord,
      apolloData,
      podcasts,
      systemPrompt
    );

    const quality = evaluateResearchQuality(research);
    const status = quality.acceptable ? 'research_complete' : 'thin_research';

    if (!quality.acceptable) {
      await query(
        `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
         VALUES ('research-quality', $1, $2, 0)`,
        [
          prospectId,
          `thin_research: ${quality.reason} (${quality.meaningfulSignalCount} signals, confidence ${quality.effectiveConfidence})`,
        ]
      ).catch((e) => console.error('[research] quality log error:', e));
    }

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
    const failure = formatApifyFailureForDb(err, {
      workflow: 'research',
      entityId: prospectId,
      retryCount: config.maxRetries,
      requestType: err instanceof ApifyScrapeError ? 'apify_scrape' : 'research_pipeline',
    });

    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ($1, $2, $3, $4)`,
      [failure.workflow, failure.entityId, failure.message, failure.retryCount]
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

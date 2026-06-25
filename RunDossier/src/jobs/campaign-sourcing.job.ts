import { query, queryOne } from '../db.js';
import { notify } from '../notify.js';
import { searchPeopleViaApollo } from '../scrapers/apollo.js';
import { ingestProspects } from '../services/intake.js';
import {
  getCampaign,
  refreshCampaignCounters,
  completeCampaign,
  type IcpConfig,
  type Campaign,
} from '../services/campaign.service.js';

const MAX_PAGES = 20; // cap to avoid infinite loops (20 × 25 = up to 500 prospects)
const PER_PAGE = 25;

interface CampaignRow {
  id: string;
  client_id: string;
  name: string;
  target_count: number;
  delivered_count: number;
  pending_count: number;
  icp_config: IcpConfig;
  locations: string[];
}

async function sourceBatch(campaign: CampaignRow, page: number): Promise<number> {
  const icp = campaign.icp_config;
  const result = await searchPeopleViaApollo({
    job_titles: icp.job_titles ?? [],
    locations: campaign.locations,
    industry: icp.industry,
    seniority: icp.seniority ?? [],
    keywords: icp.keywords ?? [],
    per_page: PER_PAGE,
    page,
  });

  if (result.people.length === 0) return 0;

  const intakeRecords = result.people.map(p => ({
    name: p.name,
    linkedin_url: p.linkedinUrl ?? undefined,
    email: p.email ?? undefined,
    title: p.title ?? undefined,
    company: p.company ?? undefined,
    client_id: campaign.client_id,
  }));

  const intake = await ingestProspects(intakeRecords, { source: 'search' });

  // Tag all newly inserted prospects with this campaign_id
  if (intake.prospectIds.length > 0) {
    await query(
      `UPDATE prospects SET campaign_id = $1
       WHERE id = ANY($2::uuid[]) AND campaign_id IS NULL`,
      [campaign.id, intake.prospectIds]
    );
  }

  return intake.inserted;
}

export async function runCampaignSourcing(): Promise<void> {
  // Pick up campaigns in 'queued' state that need prospects sourced
  const campaigns = await query<CampaignRow>(
    `SELECT id, client_id, name, target_count,
            delivered_count, pending_count,
            icp_config, locations
     FROM campaigns
     WHERE status = 'queued'
     ORDER BY started_at ASC NULLS LAST`
  );

  for (const campaign of campaigns) {
    await sourceCampaign(campaign);
  }
}

async function sourceCampaign(campaign: CampaignRow): Promise<void> {
  // Count how many prospects have already been sourced for this campaign
  const [counts] = await query<{ total: string; delivered: string }>(
    `SELECT COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered
     FROM prospects WHERE campaign_id = $1`,
    [campaign.id]
  );
  const alreadySourced = Number(counts?.total ?? 0);
  const needed = campaign.target_count - alreadySourced;

  if (needed <= 0) {
    console.log(`[campaign-sourcing] ${campaign.name}: already has ${alreadySourced} prospects sourced`);
    return;
  }

  // Transition to 'running'
  await query(
    `UPDATE campaigns SET status = 'running', updated_at = NOW()
     WHERE id = $1 AND status = 'queued'`,
    [campaign.id]
  );

  let totalIngested = 0;
  let page = 1;

  try {
    while (totalIngested < needed && page <= MAX_PAGES) {
      // Check if campaign was paused/cancelled between pages
      const fresh = await queryOne<{ status: string }>(
        `SELECT status FROM campaigns WHERE id = $1`,
        [campaign.id]
      );
      if (!fresh || fresh.status !== 'running') {
        console.log(`[campaign-sourcing] ${campaign.name}: stopped (status=${fresh?.status})`);
        break;
      }

      const ingested = await sourceBatch(campaign, page);
      totalIngested += ingested;

      console.log(`[campaign-sourcing] ${campaign.name}: page ${page} → ${ingested} ingested (total: ${totalIngested}/${needed})`);

      if (ingested < PER_PAGE) break; // no more results from Apollo
      page += 1;
    }

    await refreshCampaignCounters(campaign.id);

    await notify(
      `🔍 Campaign sourcing complete: "${campaign.name}"\n` +
      `• Sourced: ${totalIngested} new prospects (target: ${campaign.target_count})\n` +
      `• Pipeline is now running: research → personalize → deliver`
    ).catch(() => {});

    console.log(`[campaign-sourcing] ${campaign.name}: sourced ${totalIngested} prospects, pipeline running`);
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[campaign-sourcing] ${campaign.name} error:`, message);

    await query(
      `INSERT INTO failed_jobs (workflow, entity_id, error, retry_count)
       VALUES ('campaign-sourcing', $1, $2, 0)`,
      [campaign.id, message.slice(0, 500)]
    ).catch(() => {});

    // Reset to queued so it retries next cycle
    await query(
      `UPDATE campaigns SET status = 'queued', updated_at = NOW()
       WHERE id = $1 AND status = 'running'`,
      [campaign.id]
    );

    await notify(
      `❌ Campaign sourcing failed: "${campaign.name}"\n• Error: ${message.slice(0, 300)}`
    ).catch(() => {});
  }
}

/**
 * Checks if any running campaign has reached its delivery target.
 * Called by the scheduler to finalize campaigns automatically.
 */
export async function checkCampaignCompletion(): Promise<void> {
  const running = await query<{ id: string; name: string; client_id: string; target_count: number }>(
    `SELECT c.id, c.name, c.client_id, c.target_count
     FROM campaigns c
     WHERE c.status = 'running'`
  );

  for (const c of running) {
    await refreshCampaignCounters(c.id).catch(() => {});

    const fresh = await queryOne<{ delivered_count: number; failed_count: number; pending_count: number }>(
      `SELECT delivered_count, failed_count, pending_count FROM campaigns WHERE id = $1`,
      [c.id]
    );
    if (!fresh) continue;

    const totalProcessed = fresh.delivered_count + fresh.failed_count;
    const allProspects = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM prospects WHERE campaign_id = $1`,
      [c.id]
    );
    const total = Number(allProspects?.total ?? 0);

    // Campaign complete if: delivered target met, or all sourced prospects are done (no pending left)
    const hitTarget = fresh.delivered_count >= c.target_count;
    const allDone = total > 0 && fresh.pending_count === 0 && totalProcessed >= total;

    if (hitTarget || allDone) {
      const withIssues = fresh.delivered_count < c.target_count;
      await completeCampaign(c.id, withIssues, 'system').catch(e =>
        console.error('[campaign-sourcing] complete error:', e)
      );
    }
  }
}

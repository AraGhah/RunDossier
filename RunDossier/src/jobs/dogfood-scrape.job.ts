import { query } from '../db.js';
import { scrapeSalesNavigator } from '../scrapers/sales-navigator.js';
import { config } from '../config.js';
import { notify } from '../notify.js';
import {
  countWeeklyDogfoodIngests,
  logFunnelEvent,
} from '../utils/funnel-log.js';
import { scoreIcpFit } from '../utils/icp-fit.js';

const LINKEDIN_PROFILE_RE =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?/;

export async function runDogfoodScrape(): Promise<{ ingested: number; skipped: number }> {
  if (!config.dogfoodEnabled) {
    console.log('[dogfood-scrape] disabled (DOGFOOD_ENABLED=false)');
    return { ingested: 0, skipped: 0 };
  }

  const weeklyCount = await countWeeklyDogfoodIngests();
  const remaining = config.dogfoodWeeklyCap - weeklyCount;
  if (remaining <= 0) {
    console.log(`[dogfood-scrape] weekly cap reached (${config.dogfoodWeeklyCap}/7d)`);
    return { ingested: 0, skipped: 0 };
  }

  let leads;
  try {
    leads = await scrapeSalesNavigator();
  } catch (err) {
    await notify(`Dogfood scrape failed: ${(err as Error).message}`);
    throw err;
  }

  let ingested = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (ingested >= remaining) break;
    if (!LINKEDIN_PROFILE_RE.test(lead.linkedinUrl)) {
      skipped += 1;
      continue;
    }

    const [existing] = await query<{ id: string }>(
      `SELECT id FROM prospects WHERE linkedin_url = $1 LIMIT 1`,
      [lead.linkedinUrl]
    );
    if (existing) {
      skipped += 1;
      continue;
    }

    const icpScore = scoreIcpFit({
      title: lead.title,
      company: lead.company,
      employeeCount: lead.employeeCount,
    });

    const [row] = await query<{ id: string }>(
      `INSERT INTO prospects
         (name, title, linkedin_url, status, source, icp_fit_score, employee_count)
       VALUES ($1, $2, $3, 'queued', 'dogfood', $4, $5)
       RETURNING id`,
      [
        lead.name,
        lead.title || null,
        lead.linkedinUrl,
        icpScore,
        lead.employeeCount,
      ]
    );

    if (row?.id) {
      await logFunnelEvent(row.id, 'prospect', {
        source: 'sales_navigator',
        title: lead.title,
        company: lead.company,
        icp_fit_score: icpScore,
        employee_count: lead.employeeCount,
      });
      ingested += 1;
    }
  }

  const summary = `Dogfood scrape: ${ingested} ingested, ${skipped} skipped (${weeklyCount + ingested}/${config.dogfoodWeeklyCap} this week)`;
  console.log(`[dogfood-scrape] ${summary}`);
  if (ingested > 0) {
    await notify(summary);
  }

  return { ingested, skipped };
}

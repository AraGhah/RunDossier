import { query } from '../db.js';
import { config } from '../config.js';
import { notify } from '../notify.js';
import {
  compositeScore,
  meetsIcpConfidence,
  scoreIcpFit,
  topPercentCutoff,
} from '../utils/icp-fit.js';
import {
  countWeeklySmartleadQueued,
  logFunnelEvent,
} from '../utils/funnel-log.js';
import { pushToSmartlead, markSmartleadQueuePushed } from '../integrations/smartlead.js';
import { SHIPPED_LINE_STATUSES } from '../utils/first-line-status.js';

interface EligibleProspect {
  id: string;
  name: string;
  title: string;
  linkedin_url: string;
  confidence_score: number | null;
  icp_fit_score: number | null;
  employee_count: number | null;
  research_summary: string | null;
  company: string | null;
}

interface BestLine {
  variant_number: number;
  subject: string;
  opener: string;
  bridge: string;
}

export async function runDogfoodPromote(): Promise<{ queued: number; skipped: number }> {
  if (!config.dogfoodEnabled) {
    return { queued: 0, skipped: 0 };
  }

  const weeklyQueued = await countWeeklySmartleadQueued();
  const remaining = config.dogfoodWeeklyCap - weeklyQueued;
  if (remaining <= 0) {
    console.log(`[dogfood-promote] Smartlead weekly cap reached (${config.dogfoodWeeklyCap}/7d)`);
    return { queued: 0, skipped: 0 };
  }

  const candidates = await query<EligibleProspect>(
    `SELECT p.id, p.name, COALESCE(p.title, '') AS title, p.linkedin_url,
            p.confidence_score, p.icp_fit_score, p.employee_count,
            p.research_summary,
            NULL::text AS company
     FROM prospects p
     WHERE p.source = 'dogfood'
       AND trim(p.status) = 'personalized_qa_passed'
       AND p.smartlead_status IN ('none', 'eligible')
       AND (
         SELECT COUNT(*)::int
         FROM first_lines fl
         WHERE fl.prospect_id = p.id
           AND fl.status IN (${SHIPPED_LINE_STATUSES.map(s => `'${s}'`).join(', ')})
       ) >= $1
       AND NOT EXISTS (
         SELECT 1 FROM smartlead_queue sq WHERE sq.prospect_id = p.id
       )`,
    [config.variantCount]
  );

  if (candidates.length === 0) {
    return { queued: 0, skipped: 0 };
  }

  const scored = candidates.map((p) => {
    const icp =
      p.icp_fit_score ??
      scoreIcpFit({
        title: p.title,
        company: p.company ?? '',
        employeeCount: p.employee_count,
        researchSummary: p.research_summary ?? '',
      });
    return {
      prospect: p,
      icp_fit_score: icp,
      composite: compositeScore(p.confidence_score, icp),
      qualifies: meetsIcpConfidence(p.confidence_score, icp),
    };
  });

  const qualified = scored.filter((s) => s.qualifies);
  const ranked = [...qualified].sort((a, b) => b.composite - a.composite);
  const topSlice = topPercentCutoff(ranked, config.dogfoodTopPercent);
  const toQueue = topSlice.slice(0, remaining);

  let queued = 0;
  let skipped = candidates.length - toQueue.length;

  for (const entry of toQueue) {
    const p = entry.prospect;

    await query(
      `UPDATE prospects SET icp_fit_score = $1, smartlead_status = 'eligible' WHERE id = $2`,
      [entry.icp_fit_score, p.id]
    );

    const [line] = await query<BestLine>(
      `SELECT variant_number, subject, opener, bridge
       FROM first_lines
       WHERE prospect_id = $1 AND status IN (${SHIPPED_LINE_STATUSES.map(s => `'${s}'`).join(', ')})
       ORDER BY is_chosen DESC NULLS LAST, qa_score DESC NULLS LAST, variant_number ASC
       LIMIT 1`,
      [p.id]
    );
    if (!line) {
      skipped += 1;
      continue;
    }

    const [queueRow] = await query<{ id: string }>(
      `INSERT INTO smartlead_queue
         (prospect_id, variant_number, subject, opener, bridge,
          icp_fit_score, confidence_score, composite_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'queued')
       ON CONFLICT (prospect_id, variant_number) DO NOTHING
       RETURNING id`,
      [
        p.id,
        line.variant_number,
        line.subject,
        line.opener,
        line.bridge,
        entry.icp_fit_score,
        p.confidence_score,
        entry.composite,
      ]
    );

    if (!queueRow?.id) continue;

    await query(
      `UPDATE prospects SET smartlead_status = 'queued' WHERE id = $1`,
      [p.id]
    );

    await logFunnelEvent(p.id, 'queued', {
      composite_score: entry.composite,
      icp_fit_score: entry.icp_fit_score,
      confidence_score: p.confidence_score,
      variant_number: line.variant_number,
    });

    try {
      const result = await pushToSmartlead({
        prospectId: p.id,
        firstName: p.name,
        lastName: '',
        companyName: p.company ?? '',
        subject: line.subject,
        opener: line.opener,
        bridge: line.bridge,
        linkedinUrl: p.linkedin_url,
      });
      if (result === 'pushed') {
        await markSmartleadQueuePushed(queueRow.id, p.id);
      }
    } catch (err) {
      await query(
        `UPDATE smartlead_queue SET status = 'failed', error_message = $1 WHERE id = $2`,
        [(err as Error).message.slice(0, 500), queueRow.id]
      );
    }

    queued += 1;
  }

  for (const entry of scored.filter((s) => !s.qualifies)) {
    await query(
      `UPDATE prospects SET smartlead_status = 'skipped', icp_fit_score = $1 WHERE id = $2`,
      [entry.icp_fit_score, entry.prospect.id]
    );
  }

  if (queued > 0) {
    await notify(
      `Dogfood promote: ${queued} prospect(s) queued for Smartlead review (${weeklyQueued + queued}/${config.dogfoodWeeklyCap} this week)`
    );
  }

  console.log(`[dogfood-promote] queued=${queued} skipped=${skipped}`);
  return { queued, skipped };
}

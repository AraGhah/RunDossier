import { query } from '../db.js';

export interface DashboardRow {
  id: string;
  name: string;
  tier: string | null;
  mrr: number | null;
  status: string;
  health_score: number | null;
  reply_rate: number | null;
  next_delivery_date: string | null;
  delivered_this_month: number;
  last_delivered_at: string | null;
  in_pipeline: number;
}

/** One row per client with the live ops metrics, computed from Supabase. */
export async function getDashboardRows(): Promise<DashboardRow[]> {
  return query<DashboardRow>(
    `SELECT c.id, c.name, c.tier, c.mrr, c.status, c.health_score, c.reply_rate, c.next_delivery_date,
       COALESCE(d.delivered_this_month, 0)::int AS delivered_this_month,
       d.last_delivered_at,
       COALESCE(p.in_pipeline, 0)::int AS in_pipeline
     FROM clients c
     LEFT JOIN (
       SELECT client_id,
         COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at >= date_trunc('month', NOW())) AS delivered_this_month,
         MAX(delivered_at) AS last_delivered_at
       FROM prospects GROUP BY client_id
     ) d ON d.client_id = c.id
     LEFT JOIN (
       SELECT client_id, COUNT(*) AS in_pipeline
       FROM prospects
       WHERE status IN ('queued','research_in_progress','research_complete','personalization_in_progress','personalized_qa_passed')
       GROUP BY client_id
     ) p ON p.client_id = c.id
     ORDER BY c.mrr DESC NULLS LAST, c.name`
  );
}

/** Stored health_score wins; otherwise a simple heuristic from status + delivery recency. */
export function healthScore(row: DashboardRow): number {
  if (row.health_score != null) return row.health_score;
  if (row.status === 'paused' || row.status === 'churned') return 20;
  if (row.status !== 'active') return 55;
  let score = 70;
  if (row.delivered_this_month > 0) score += 20;
  if (row.last_delivered_at) {
    const days = (Date.now() - new Date(row.last_delivered_at).getTime()) / 86_400_000;
    score += days <= 14 ? 10 : -15;
  } else {
    score -= 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

import { query } from '../db.js';

export type FunnelStage =
  | 'prospect'
  | 'researched'
  | 'personalized'
  | 'queued'
  | 'open'
  | 'reply'
  | 'demo'
  | 'closed';

export async function logFunnelEvent(
  prospectId: string,
  stage: FunnelStage,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await query(
      `INSERT INTO dogfood_funnel_events (prospect_id, stage, metadata)
       VALUES ($1, $2, $3)`,
      [prospectId, stage, JSON.stringify(metadata)]
    );
  } catch (err) {
    // Migration may not be applied yet — log but don't break pipeline
    console.warn(`[funnel] skip ${stage} for ${prospectId}:`, (err as Error).message);
  }
}

export async function countWeeklyDogfoodIngests(): Promise<number> {
  try {
    const [row] = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM prospects
       WHERE source = 'dogfood'
         AND created_at >= NOW() - INTERVAL '7 days'`
    );
    return parseInt(row?.count ?? '0', 10);
  } catch {
    return 0;
  }
}

export async function countWeeklySmartleadQueued(): Promise<number> {
  try {
    const [row] = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT prospect_id)::text AS count
       FROM smartlead_queue
       WHERE created_at >= NOW() - INTERVAL '7 days'
         AND status IN ('queued', 'pushed')`
    );
    return parseInt(row?.count ?? '0', 10);
  } catch {
    return 0;
  }
}

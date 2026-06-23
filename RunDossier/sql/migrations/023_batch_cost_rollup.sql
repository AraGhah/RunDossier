-- 023: Batch cost rollup + observability backfills.
-- ai_costs links to a batch via ai_costs.prospect_id -> prospects.batch_id.
-- Before this, batches.total_cost_usd was always 0 and delivered_at was null.
-- Helper fns + one-time idempotent backfills. APPLIED to production 2026-06-22
-- (Supabase migration: batch_cost_rollup_helpers, plus manual backfills).

CREATE OR REPLACE FUNCTION recompute_batch_cost(p_batch_id uuid)
RETURNS numeric LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE batches b
  SET total_cost_usd = COALESCE((
        SELECT round(sum(ac.cost_usd), 4)
        FROM ai_costs ac JOIN prospects p ON p.id = ac.prospect_id
        WHERE p.batch_id = b.id), 0)
  WHERE b.id = p_batch_id
  RETURNING b.total_cost_usd;
$$;

CREATE OR REPLACE FUNCTION recompute_all_batch_costs()
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE batches b
  SET total_cost_usd = COALESCE((
        SELECT round(sum(ac.cost_usd), 4)
        FROM ai_costs ac JOIN prospects p ON p.id = ac.prospect_id
        WHERE p.batch_id = b.id), 0);
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END; $$;

REVOKE ALL ON FUNCTION recompute_batch_cost(uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION recompute_all_batch_costs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION recompute_batch_cost(uuid)  TO service_role;
GRANT EXECUTE ON FUNCTION recompute_all_batch_costs() TO service_role;

-- One-time backfills (idempotent; no-ops on a fresh DB):
SELECT recompute_all_batch_costs();

UPDATE batches b
SET delivered_at = COALESCE(
      (SELECT max(p.delivered_at) FROM prospects p WHERE p.batch_id = b.id), b.created_at)
WHERE b.status = 'delivered' AND b.delivered_at IS NULL;

UPDATE ai_costs SET agent_name = btrim(agent_name)
WHERE agent_name IS DISTINCT FROM btrim(agent_name);

-- Close out empty batches stuck in 'queued' > 1 day (e.g. dup-rejected intake attempts).
UPDATE batches SET status = 'failed'
WHERE status = 'queued' AND prospect_count = 0 AND created_at < now() - interval '1 day';

-- NOTE for WF5 / delivery.job.ts: call `SELECT recompute_batch_cost('<batch_id>');`
-- (and set batches.delivered_at + status='delivered') at the end of each batch.

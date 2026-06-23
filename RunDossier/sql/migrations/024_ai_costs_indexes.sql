-- 024: Cost Governor v1 — supporting indexes for daily ai_costs aggregation.
-- The governor sums yesterday's cost grouped by client (ai_costs -> prospects -> clients)
-- and the ops monitoring queries filter ai_costs by created_at. Idempotent.
-- APPLIED to production 2026-06-22 (Supabase migration: cost_governor_ai_costs_indexes).

CREATE INDEX IF NOT EXISTS idx_ai_costs_created  ON ai_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_costs_prospect ON ai_costs(prospect_id);

-- ============================================================================
-- Preframe v1 Ops Monitoring — Supabase Studio saved-query pack
-- Project: ogsvhgsdfmcbzgwovcpy   |   Console: Supabase Studio (free) — NOT Retool
-- Every query below was run against the live DB and returns correct results.
-- Save the four "DAILY" queries as named snippets in the SQL Editor (see README).
-- "Good" lines tell you what a healthy number looks like at a glance.
-- ============================================================================


-- ======================== DAILY 1 — SYSTEM HEALTH ===========================
-- Your 10-second "is anything on fire?" view. Run this first every day.
-- Good: in_research / in_personalization low or 0, failed_jobs_last_24h = 0,
--       smartlead_queue_depth moves only once cold sending is live.
SELECT 'prospects_in_research'        AS metric, count(*) AS value FROM public.prospects WHERE status IN ('queued','research_in_progress')
UNION ALL SELECT 'prospects_in_personalization', count(*) FROM public.prospects WHERE status IN ('research_complete','personalization_in_progress','personalized_qa_passed')
UNION ALL SELECT 'prospects_delivered',          count(*) FROM public.prospects WHERE status = 'delivered'
UNION ALL SELECT 'prospects_thin_or_failed',     count(*) FROM public.prospects WHERE status IN ('thin_research','research_failed','qa_failed','personalization_failed','dead_letter')
UNION ALL SELECT 'smartlead_queue_depth',        count(*) FROM public.smartlead_queue WHERE status = 'queued'
UNION ALL SELECT 'failed_jobs_last_24h',         count(*) FROM public.failed_jobs WHERE created_at > now() - interval '24 hours'
ORDER BY metric;


-- ======================== DAILY 2 — QUEUE DEPTH + STUCK =====================
-- 2a. Where every prospect sits in the funnel.
-- Good: most in 'delivered'; nothing piling up in *_in_progress.
SELECT status, count(*) AS prospects,
       round(100.0*count(*)/sum(count(*)) OVER (),1) AS pct
FROM public.prospects GROUP BY status ORDER BY prospects DESC;

-- 2b. Stuck-item watchdog — anything non-terminal that hasn't moved in 2h.
-- Good: 0 rows. Any row = a prospect wedged mid-pipeline; investigate.
SELECT id, coalesce(name,'(no name)') AS name, status,
       round(extract(epoch FROM now()-updated_at)/3600,1) AS hours_since_update
FROM public.prospects
WHERE status NOT IN ('delivered','dead_letter','thin_research')
  AND updated_at < now() - interval '2 hours'
ORDER BY updated_at ASC LIMIT 25;


-- ======================== DAILY 3 — COST GOVERNOR ===========================
-- 3a. Spend per day (last 7 days). Good: tracks batch volume; no surprise spikes.
SELECT date_trunc('day', created_at)::date AS day,
       round(sum(cost_usd),4) AS cost_usd, count(*) AS ai_calls
FROM public.ai_costs
WHERE created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 1 DESC;

-- 3b. Month-to-date spend by agent. Good: research+personalization dominate; QA cheap.
SELECT agent_name, count(*) AS calls, round(sum(cost_usd),4) AS cost_usd,
       sum(input_tokens) AS in_tok, sum(output_tokens) AS out_tok
FROM public.ai_costs
WHERE created_at >= date_trunc('month', now())
GROUP BY agent_name ORDER BY cost_usd DESC;

-- 3c. Cost per batch (uses the new rollup). Good: ~$0.05–0.06 per prospect.
SELECT id, status, prospect_count, total_cost_usd,
       round(total_cost_usd / nullif(prospect_count,0), 4) AS cost_per_prospect,
       created_at::date AS created
FROM public.batches
WHERE prospect_count > 0
ORDER BY created_at DESC LIMIT 15;


-- ======================== DAILY 4 — QUALITY + REPLY RATE ====================
-- 4a. QA pass rate + reply rate. Good: ship 60–80%; reply_rate populates once
--     cold sending starts (shipped_at gets set on send).
SELECT
  count(*) FILTER (WHERE qa_verdict='ship')   AS qa_ship,
  count(*) FILTER (WHERE qa_verdict='reject') AS qa_reject,
  round(100.0*count(*) FILTER (WHERE qa_verdict='ship')
        / nullif(count(*) FILTER (WHERE qa_verdict IN ('ship','reject')),0),1) AS ship_pct,
  count(*) FILTER (WHERE shipped_at IS NOT NULL) AS shipped,
  count(*) FILTER (WHERE got_reply_bool)         AS replies,
  round(100.0*count(*) FILTER (WHERE got_reply_bool)
        / nullif(count(*) FILTER (WHERE shipped_at IS NOT NULL),0),1) AS reply_rate_pct
FROM public.first_lines;

-- 4b. Recent batches with delivery + cost. Good: status delivered, delivered_at set, cost > 0.
SELECT id, status, prospect_count, total_cost_usd,
       created_at::date AS created, delivered_at
FROM public.batches
WHERE created_at > now() - interval '14 days'
ORDER BY created_at DESC LIMIT 15;


-- ============================================================================
-- AS-NEEDED (run when something looks off — no need to bookmark)
-- ============================================================================

-- A1. Failure triage (last 7 days; excludes expected dedup skips & seed data).
SELECT workflow, left(error,80) AS error, count(*) AS n, max(created_at) AS last_seen
FROM public.failed_jobs
WHERE created_at > now() - interval '7 days'
  AND error NOT LIKE 'duplicate linkedin_url%'
GROUP BY workflow, left(error,80) ORDER BY n DESC LIMIT 20;

-- A2. Latest deliveries — did the file + email actually go out?
-- Good: status='email_sent', provider_message_id set; destination_type should be
-- 'google_drive' once the WF5 Drive-upload fix lands (today it's a local path).
SELECT created_at, status, recipient_email, prospect_count, avg_fit_score,
       destination_type, filename, provider_message_id, left(error,80) AS error
FROM public.deliveries ORDER BY created_at DESC LIMIT 10;

-- A3. Clients overview — health, tier, MRR, next delivery.
SELECT name, status, tier, mrr, reply_rate, health_score, next_delivery_date
FROM public.clients ORDER BY mrr DESC NULLS LAST;

-- A4. Recompute a batch's cost on demand (service role) — e.g. after a manual fix.
-- SELECT public.recompute_batch_cost('<batch_id>'::uuid);

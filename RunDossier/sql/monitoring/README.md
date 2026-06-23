# Preframe v1 Ops Monitoring — Supabase Studio (no Retool)

Your admin dashboard for v1 is **Supabase Studio** (free). It shows your tables, runs
SQL, and saves queries. That covers everything until you have many clients. **Skip Retool
and Softr for now** — add Retool only around month 3+ when you have 5+ active clients and
genuinely need a non-SQL view for non-technical eyes. Don't pay for or build a BI tool yet.

`ops_monitoring_queries.sql` holds 4 **DAILY** queries (bookmark these) + 4 **AS-NEEDED**.
Every query was run against the live DB and returns correct results.

## Save them as bookmarks in Studio (one-time, ~2 minutes)
In Supabase Studio, a "saved query" is a **snippet** in the SQL Editor's left sidebar.
1. Open your project → **SQL Editor** (left nav).
2. Click **+ New query**, paste one query from the pack, click **Run** (or Ctrl/Cmd+Enter).
3. **Rename** the snippet (double-click its name in the left sidebar) to e.g.
   `① Health`, `② Queue`, `③ Cost`, `④ Quality`. It auto-saves and persists per project.
4. Repeat for the four DAILY queries. They'll sit in the sidebar as your daily checklist.
   (Snippets are private to you by default; use "Share" if a teammate needs them.)

Tip: number them ①–④ so your daily scan is top-to-bottom in under a minute.

## Your <1-minute daily scan
| # | Query | Look for | Healthy today |
|---|-------|----------|---------------|
| ① | System Health | `failed_jobs_last_24h`, anything stuck `in_research`/`in_personalization` | all low / 0 |
| ② | Queue Depth + Stuck | watchdog returns **0 rows**; funnel mostly `delivered` | 0 stuck |
| ③ | Cost Governor | daily spend tracks volume; `cost_per_prospect` ~$0.05–0.06 | no spikes |
| ④ | Quality + Reply | `ship_pct` 60–80%; `reply_rate_pct` once cold sending starts | ship ~66% |

If ① and ② are clean, the system is healthy — you're done. If something's off, run the
**AS-NEEDED** queries (failure triage, deliveries, clients) to drill in.

## Baseline (live numbers at setup, 2026-06-22)
- Prospects: **115 delivered**, 6 thin_research; queue empty; **0 stuck**, **0 failures in 24h**.
- Spend: **$5.71** on Jun 21 (446 AI calls); ~$0.054 per prospect on the 50-batch.
- Quality: QA **ship 66.4%** (229 ship / 116 reject); 0 shipped to cold yet (warmup), so
  reply rate is intentionally blank until sending starts.

## Notes
- `cost_per_prospect` and per-batch cost work because the cost rollup was wired up
  (`batches.total_cost_usd` is now populated; `recompute_batch_cost()` keeps it fresh).
- Query **A2** will show `destination_type='google_drive'` only after the WF5 Drive-upload
  fix ships — today the CSV is written to a local path (see the pipeline audit report).
- Reassess Retool at: **5+ active clients _or_ a non-technical teammate doing ops**.

# Preframe Pipeline — End-to-End Verification Report
**Date:** 2026-06-22 · **Project:** Supabase `ogsvhgsdfmcbzgwovcpy` (Preframe / getdossier.co)
**Scope:** WF1 onboarding → WF2 intake → WF3 research → WF4 personalization+QA → WF5 delivery

## Verdict: NOT yet client-ready — 2 blockers (both n8n-side)
The pipeline runs and most observability is now intact, but a paying client would **not
receive their file** (CSV isn't uploaded to Drive) and the personalizer **silently drops
prospects** on a length technicality. Both are fixable in n8n; details below. Everything I
could fix in the database is fixed and verified.

> **Important scope note:** the pipeline is fully **n8n-orchestrated** (no Supabase edge
> functions exist), so I could read every table, cost, file path and log, but I cannot
> *trigger* a run from here. The second batch was already attempted and dead-ended —
> see "Why batch 2 didn't run" — so a true second batch must be launched by you with a
> **fresh prospect list**. Use the checklist at the end.

---

## What is verified working (from batch 1, the 50-prospect run)
- WF3 research → WF4 personalization → **QA split** all execute. QA verdicts: **229 ship /
  116 reject** (33% reject) — the split is functioning and gating.
- **115 prospects delivered**, 6 correctly held as `thin_research`.
- **`ai_costs` logs accurately:** 552 rows, **$6.29** total — research $2.77, personalization
  $2.70, QA $0.81.
- WF5 produced a CSV (98 rows, avg fit 79) and **sent the notification email**
  (`status=email_sent`, provider message id present, `emailed_at` set) to `ara@getdossier.co`.

## Why batch 2 didn't run (and how to make it run)
Batch `42fe2331` (Jun 21 16:06) is the second-batch attempt. It used the **same 50 people**
as batch 1, so WF2 intake correctly rejected all of them as `duplicate linkedin_url` → the
batch got 0 prospects and sat stuck in `queued` (I've now marked it `failed`). **A real
batch 2 needs new prospects** (a fresh Sales-Navigator/Apify source or different ICP).

---

## Issues found

| # | Severity | Issue | Owner | Status |
|---|----------|-------|-------|--------|
| B1 | Blocker | CSV written to local disk (`data\deliveries\…`), **never uploaded to Drive**; `destination_type`/`delivery_folder_id` null | n8n | Open → see n8n_fixes.md |
| B2 | Blocker | WF4 hard word-limits dead-letter valid prospects ("no variants after 3 attempts": bridge 27/ max 25, etc.) — 50 drops | n8n | Open → n8n_fixes.md |
| H1 | High | WF2 logs **expected duplicates** as `failed_jobs` (65 rows) → looks like silent failures | n8n | Open (purge SQL ready) |
| H2 | High | Apify actor needs permission approval; blank LinkedIn URLs hit the scraper | n8n / Apify | Open |
| F1 | Fixed | `batches.total_cost_usd` = 0 on every batch (rollup never computed) | DB | **Fixed + verified** |
| F2 | Fixed | `batches.delivered_at` null even when delivered | DB | **Fixed + verified** |
| F3 | Fixed | `ai_costs.agent_name` had a trailing-space duplicate splitting cost totals | DB | **Fixed + verified** |
| F4 | Fixed | Stuck empty `queued` batch from the dup-rejected attempt | DB | **Fixed (→ failed)** |
| M1 | Med | Cost rollup helper exists but WF5 doesn't call it yet | n8n | Open (1-line RPC) |
| — | Info | ~1,227 of 1,371 `failed_jobs` are historical/seed (dated 2000-01-01), not active | — | Noted |

---

## DB fixes applied (live, verified)
Migration `batch_cost_rollup_helpers` + one-time backfills (full SQL in `db_fixes_applied.sql`):

| Check | Before | After |
|-------|--------|-------|
| Batch 1 (50p) `total_cost_usd` | 0.0000 | **2.6932** |
| Batch (40p) `total_cost_usd` | 0.0000 | 2.4843 |
| Batch (10p) `total_cost_usd` | 0.0000 | 0.5340 |
| Delivered batches missing `delivered_at` | 3+ | **0** |
| Distinct `agent_name` values | 4 (one dup) | **3** |
| Stuck `queued` empty batch | 1 | 0 (→ failed) |

New helpers: `recompute_batch_cost(uuid)` and `recompute_all_batch_costs()` (service-role
only). Total cost now attributed to batches = $5.71; the remaining $0.58 is 18 prospects
that carry no `batch_id` (not linked to any batch — minor data-lineage gap, noted).

---

## Checklist — run a clean batch 2
1. **Apply the 2 blocker fixes** in n8n (B1 Drive upload, B2 length handling) — see `n8n_fixes.md`.
2. Approve the Apify actor (H2) and add the blank-URL guard.
3. Change WF2 to skip-not-fail on duplicates (H1); purge the 65 noise rows.
4. Add the `recompute_batch_cost('<batch_id>')` RPC call to WF5 (M1).
5. **Seed a fresh 50-prospect list** (new people — not batch 1's).
6. Trigger WF1→WF5. While it runs, watch these and confirm each:
   - `prospects` rows created (status ladder advances, not stuck `queued`/`research_failed`).
   - `first_lines` created with QA verdicts; reject rate sane (~20–35%).
   - `ai_costs` rows accrue; `batches.total_cost_usd` > 0 after WF5.
   - `deliveries` row: `destination_type='google_drive'`, a real `destination_ref`, `email_sent`.
   - The CSV actually appears in the client's Drive folder; the email lands.
   - `failed_jobs`: **zero new rows** for this run (dedup skips no longer counted).
7. Done = all six green on a fresh batch. Then it's GO for a paying client.

## Appendix — cost by agent (post-fix)
research_agent $2.77 (130 calls) · personalization_agent $2.70 (258) · qa_agent $0.81 (154).

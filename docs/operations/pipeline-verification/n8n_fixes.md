# n8n-side fixes (code-level) — do these before a paying client

I can't edit your n8n workflows from here, but here's exactly what to change.
Ordered by severity. B = blocker, H = high, M = medium.

## B1 — WF5 Delivery: the CSV never reaches Google Drive
**Evidence:** `deliveries.file_path = data\deliveries\Dossier Delivery - 2026-06-21 - Test_Client.csv`
(a local n8n path), `deliveries.destination_type` / `destination_ref` are NULL,
`clients.delivery_folder_id` is NULL, and a Drive search finds no such file.
The notification email *did* send (`status=email_sent`, `provider_message_id` set),
so a client today would get an email pointing at a file that isn't in their Drive.

**Fix in WF5:**
1. After the "write CSV" node, add a **Google Drive: Upload** node. Parent folder =
   `clients.delivery_folder_id` (add per-client; fall back to one master "Deliveries" folder).
2. Write the result back: `deliveries.destination_type='google_drive'`,
   `destination_ref = <drive file id>`, and store the shareable link.
3. Populate `clients.delivery_folder_id` during WF1 onboarding (create/lookup the folder).
4. Set `deliveries.batch_id` on insert — it's currently NULL, so deliveries can't be
   joined back to their batch.

## B2 — WF4 Personalization: hard word-limit dead-letters valid prospects
**Evidence:** 50 `personalize` dead-letters, all "Personalization produced no variants
after 3 attempts" caused by length validation — e.g. `bridge: 27 words (max 25)`,
`opener: 31 (max 30)`, `opener+bridge: 56 (max 55)`. The model is producing good copy
that's 1–6 words over a hard cap, then the whole prospect is dropped.

**Fix (pick one, in order of preference):**
- **Best:** make length a *soft* signal in the QA agent's score, not a hard gate.
  Let the QA agent reject only on quality; trim/penalize length instead of failing.
- **Or:** raise the caps to match reality — opener ≤ 35, bridge ≤ 30, opener+bridge ≤ 65.
- **And:** change the retry terminal state from "dead-letter" to "ship best-scoring
  variant" (or mark prospect `thin_research`) so a length miss never silently drops a
  prospect. Add the over-limit count to the QA log so you can tune later.

## H1 — WF2 Intake logs expected duplicates as failures
**Evidence:** 65 `failed_jobs` rows `duplicate linkedin_url (status: delivered)` from the
second-batch attempt (all 50 were already in batch 1). Dedup working = good; writing it to
`failed_jobs` = bad (looks like 65 silent failures, pollutes observability).

**Fix:** in the intake upsert, treat an existing `linkedin_url` as a **skip**, not an error.
Log it to `events` (e.g. `event_type='prospect_skipped_duplicate'`) and increment a
`leads_skipped` counter — do **not** insert into `failed_jobs`. Then purge the 65 noise
rows (commented SQL in `db_fixes_applied.sql`).

## H2 — WF3 Research: Apify actor approval + blank-URL guard
**Evidence:** `failed_jobs` shows `"This Actor requires full access to your account. You
must approve its permissions…"` (48) and 727 `No LinkedIn profile returned for
https://www.linkedin.com/` (a bare domain = empty/blank URL passed to the scraper).
Most are historical (dated 2000-01-01) but the actor-approval will bite a live run.

**Fix:**
1. Open the Apify actor (`harvestapi~linkedin-profile-scraper` / `LpVuK3Zozwuipa5bp`) in the
   Apify console and approve its permissions for the account/token n8n uses.
2. Add a guard before the scrape node: skip rows where `linkedin_url` is null, the bare
   domain, or not `…/in/…`. Route them to `thin_research`, don't call Apify.

## M1 — Wire the cost rollup (DB helper is ready)
I added `recompute_batch_cost(batch_id)` and `recompute_all_batch_costs()`. They work, but
nothing calls them yet. In **WF5**, after delivery, add a Supabase RPC/SQL node:
`select public.recompute_batch_cost('<batch_id>'::uuid);` so `batches.total_cost_usd` stays
live. Also set `batches.delivered_at = now()` and `batches.status='delivered'` at the same step.

## M2 — Confirm the cost governor reads the rollup
The per-batch cost cap should compare against the rolled-up `batches.total_cost_usd`
(now populated) or a live `sum(ai_costs)` for the batch. Verify the governor isn't reading
the old always-zero column (which would mean the cap never trips).

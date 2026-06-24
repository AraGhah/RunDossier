# Batch-of-1,000 Reliability — Root Cause & Fix Report

**Date:** 2026-06-24 · **Symptom:** requested 1,000 prospects, received an email with only **44 delivered / 13 thin_research** (delivery `7f24965b-418f-4c73-a78b-07e91895ded3`), pipeline stopped ~50.

## 1. Exact root cause (two compounding bugs)

**Bug A — the request never ran under a parent batch, so the legacy gate shipped a partial as final.**
Your codebase already has a correct parent-batch system (`parent_batches`, `requested_prospect_count`, the `batch-orchestrator` job, `shouldDeliverParentBatch`, reconciliation, replacements, stall alerts, resume). But that batch was ingested through a path that calls `ingestProspects` **without** a `parent_batch_id` (intake / search / script), so completion fell to the *legacy* trigger `maybeRunDeliveryForClient` → `shouldRunDelivery(pending, ready)`. "pending" only counted **pipeline-active** statuses and **ignored `thin_research`, `dead_letter`, `research_failed`, `qa_failed`, `personalization_failed`**. So once the rest of the batch had failed, pending hit 0, `ready` (44) > 0, and it delivered the 44 and marked the child batches delivered — treating one partial wave as the whole request.

**Bug B — a transient provider outage was permanently dead-lettered.**
The QA judge is Gemini (`gemini-2.5-pro`) and its configured fallback is *also* Gemini, so when **your Google AI prepayment credits depleted** (confirmed in your Telegram screenshot: "Your prepayment credits are depleted"), every QA call threw, the personalize ladder (`haiku → sonnet → opus`) exhausted, and each prospect went to **`dead_letter`** (terminal). A temporary billing outage thus *destroyed* prospects and accelerated Bug A's "nothing active → deliver" condition.

The depleted Gemini credits were the actual trigger of this specific run; Bugs A & B are why the system mishandled it instead of pausing and finishing all 1,000.

## 2. Files changed

| File | Change |
|---|---|
| `src/utils/provider-error.ts` | **New.** `classifyProviderError()` / `isTransientProviderError()` — detects credit depletion, quota/RESOURCE_EXHAUSTED, 429, 5xx/overloaded, network/timeout as **transient**; auth/permission/model-not-found as **permanent**. |
| `src/utils/provider-error.test.ts` | **New.** 7 unit tests (all passing). |
| `src/jobs/personalize.job.ts` | On a **transient** provider error, set the prospect to `personalization_failed` (**retryable**) + log `personalize-provider-outage`, instead of continuing the ladder to `dead_letter`. |
| `src/utils/delivery-trigger.ts` | Legacy delivery "pending" now includes `RETRYABLE_STATUSES`, so it will **not** ship while any prospect is still retryable (incl. a provider outage). |

**Already present in your codebase (verified, not rebuilt):** parent-batch model + migration, orchestrator with internal chunks (`schedulerCyclesPerTick`), `shouldDeliverParentBatch` (waits for active **and** retryable to reach 0), replacement sourcing, reconciliation (`reconcileDeliveryCounts`), stall detection + Telegram alert, `POST /api/parent-batches/:id/resume`, and a personalize retry cap (`shouldSchedulerRetryPersonalize`).

## 3. How a 1,000 job now reliably completes across chunks

1. Start the job as a **parent batch** (`POST /api/parent-batches` with `requested_count: 1000`, or `startParentBatch(...)`). This is the supported entry point and the one to standardize on.
2. The scheduler claims work in safe chunks (`schedulerBatchSize`) and runs multiple cycles per tick while a parent batch is active; the orchestrator (every 2 min) refreshes counters, sources replacements for any deficit, and only calls delivery when `shouldDeliverParentBatch()` is true.
3. **With Fix B**, a provider outage (e.g. Gemini credits) leaves prospects **retryable**, not dead-lettered. `shouldDeliverParentBatch` returns false while `retryableCount > 0`, so the batch **holds** instead of shipping a partial, and the scheduler keeps retrying. When credits are restored, the retries succeed and the batch finishes all 1,000 (or marks `partial` only if the input list is genuinely exhausted, with exact counts).
4. **With Fix A**, even a job that slips through without a parent batch will no longer ship a partial while prospects are retryable.

## 4. Test results

- `src/utils/provider-error.test.ts` — **7/7 passing** (verified in-sandbox via isolated compile + `node --test`). Covers the exact "prepayment credits are depleted" string, 429/quota/5xx/network → transient; auth/model → permanent; QA-rejection text → unknown (keeps existing dead-letter behavior).
- Existing batch suite already in the repo (`batch-progress.test.ts`, `batch-stress-simulation.test.ts`, `batch-failure-scenarios.test.ts`, `batch-orchestration-regression.test.ts`, `batch-reconciliation.test.ts`) covers the completion/replacement/reconciliation gates.
- **Full `tsc --noEmit` passed cleanly earlier this session.** A later run was blocked by an OneDrive sync storm corrupting the Linux build mount's cached copies of 14 unrelated files (NUL bytes / truncation visible in `config.ts`, `icp-fit.ts`, etc.) — an environment artifact, not a code error.

## 5. What you must do / remaining constraints

1. **Top up Google AI (Gemini) prepayment credits** — `https://ai.studio` billing. This was the live trigger; until restored, QA fails and prospects will (now safely) sit retryable rather than ship.
2. **Validate in your environment** (the sandbox has no DB/provider keys, and a real run would spend credits + send email, so I did not run it live):
   ```bash
   npm run build && npm test        # full type-check + unit suite (no OneDrive mount)
   # then, with a non-production client, a 100-prospect parent batch:
   #   POST /api/parent-batches { client_id, requested_count: 100, prospects:[...] }
   #   GET  /api/parent-batches/<id>   # watch counts advance across chunks
   ```
   Verify: CSV row count == delivered count; email counts == DB counts; thin/failed visible with reasons; parent batch only completes when every prospect is delivered / excluded / permanently failed.
3. **Standardize batch requests on the parent-batch entry point** so the legacy gate is never the completer for a targeted batch.
4. **Consider a cross-provider QA fallback** — today `QA_MODEL_PRIMARY` and `QA_MODEL_FALLBACK` are both Gemini, so a Gemini outage has no fallback. Pointing the fallback at a non-Gemini judge would let QA survive a single-provider outage (config-only change; out of scope for this fix).

## 6. Recovery for the affected batch
If the original 1,000 request is still half-processed: top up Gemini credits, then either resume it (`POST /api/parent-batches/<id>/resume` if it has a parent batch) or re-submit the remaining input under a new parent batch. The 90-day intake dedupe will skip already-delivered prospects, so replacements won't duplicate.

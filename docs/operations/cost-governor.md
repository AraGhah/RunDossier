# Cost Governor v1 (Workflow 11)

Daily Telegram cost alerts (free bot — not Twilio) + a non-bypassable per-prospect
retry budget. Built in TypeScript alongside the other scheduled jobs (the live pipeline
runs on the TS app + pg-boss; the n8n W2–W5 workflows are inactive and n8n has no
Telegram credential, and the per-prospect cap must live in code regardless).

## Components
1. **Cost logging** *(pre-existing)* — every AI call is logged to `ai_costs` by
   `src/utils/cost-tracker.ts` (research, personalize, QA agents).
2. **Daily governor** — `src/jobs/cost-governor.job.ts`, scheduled in `src/queue.ts`
   at cron `0 1 * * *` (01:00). Sums **yesterday's** `ai_costs` grouped by client,
   compares to tier soft-caps and the global ceiling, and sends a Telegram alert via
   `notify()` when exceeded. Quiet when clean. Records an `events` row
   (`event_type = 'cost_governor_alert'`).
3. **Per-prospect hard cap** — `effectivePerProspectCapUsd()` in
   `src/utils/cost-governor.ts`, enforced in `src/jobs/personalize.job.ts`. The $0.25
   ceiling is non-bypassable: `PER_PROSPECT_COST_CAP` may only **lower** it (for tests),
   never raise it. On exceed, the personalization ladder stops and the prospect
   dead-letters.

## Caps (all in `src/utils/cost-governor.ts`)
| Scope | Cap | Action |
|-------|-----|--------|
| Per client / day — Starter | $10 | Telegram alert |
| Per client / day — Pro | $20 | Telegram alert |
| Per client / day — Scale | $35 | Telegram alert |
| Global / day | $50 | Telegram alert (immediate on the daily run) |
| Per prospect (retry budget) | $0.25 | stop ladder → dead-letter |

Unknown tiers fall back to the strictest (Starter $10).

## Test it — the "done when": a spike pings your phone
With the app's env set (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`):

```bash
cd RunDossier
npm run governor:simulate
```

This injects a $60 cost spike dated yesterday, runs the governor (which sends the
Telegram alert to your chat), then deletes the simulated row. You should receive the
message on your phone.

## Unit tests
```bash
npm test    # runs src/utils/cost-governor.test.ts (node:test)
```
Covers cap clamping (non-bypassable), tier caps, breach detection + ordering, the
global ceiling, and alert formatting. The same logic was verified independently in this
session: **12/12 checks passed**.

## Database
`sql/migrations/024_ai_costs_indexes.sql` adds indexes on `ai_costs(created_at)` and
`(prospect_id)` for the daily aggregation. **Applied to production** (Supabase migration
`cost_governor_ai_costs_indexes`). Fresh DB: `npx tsx scripts/apply-warmpilot-cost-migrations.ts`.

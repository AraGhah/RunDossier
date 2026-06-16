# Preframe / RunDossier — Code-First Execution Plan

_Analyzed from the live repository, 2026-06-14. Companion to `DEPLOYMENT_ROADMAP.md` (which covers deploy/env detail). This document focuses on making Preframe a fully coded SaaS with **no n8n dependency**._

---

## 1. Executive summary

Good news up front: **Preframe is already a code-first system.** The research → personalization → QA → delivery pipeline is implemented as **pg-boss jobs + TypeScript services**, not n8n. Your only n8n artifact (`n8n/workflow-10-dogfood.json`) is a thin scheduler that calls three backend HTTP endpoints — endpoints that **already exist and are already scheduled by pg-boss**. So removing n8n means deleting one file and flipping one flag, not re-engineering anything.

The real remaining work is: (1) deploy the current code (the live container is an old commit), (2) set the new required env vars, (3) apply DB migrations, (4) wire the landing form, (5) **decommission n8n**, and (6) build a small **admin/visibility API** (list prospects, retry failed jobs) if you want a dashboard. That's it.

---

## 2. Current project state (what actually exists)

**Already built and code-first:**
- **API layer** — `RunDossier/src/index.ts` mounts: `/health`, `/api/auth/token`, `/api/pilot/token`, `/api/pilot`, `/api/intake`, `/api/search`, `/dogfood/*`. Middleware: CORS, security headers, JWT auth, rate limiting (`src/middleware/*`).
- **Queue/worker layer** — `src/queue.ts` registers 7 queues with cron schedules:
  - `research`, `personalize` (event-driven)
  - `scheduler` every 5 min, `delivery` every 15 min, `dogfood-scrape` every 6 h, `dogfood-promote` every 15 min, `prospect-search` daily 07:00
- **Services / agents** — `src/agents/{research,personalize,qa}.agent.ts`, `src/services/{intake,prospect-search}.ts`, `src/scrapers/{linkedin,apollo,sales-navigator,podcast}.ts`, `src/integrations/smartlead.ts`.
- **AI** — Anthropic (research Haiku, personalize Sonnet) + Gemini 2.5 Pro QA judge (`src/utils/gemini.ts`).
- **Status machine** (in `src/jobs/scheduler.job.ts`): `queued → research_in_progress → research_complete → personalization_in_progress → personalized_qa_passed → (delivery ships first line)`, with rollback on failure.
- **Error handling / cost tracking** — `failed_jobs` table, `src/utils/retry.ts`, `src/utils/cost-tracker.ts` (→ `ai_costs`).
- **DB** — `sql/schema.sql` + `sql/migrations/002–008` + `sql/seeds/workflow-prompts.sql`.
- **Frontend** — `landing/` (React/Vite, Cloudflare Pages) calling the API via `landing/src/lib/api.js`.

**Partially complete / broken:**
- Live backend runs **old commit `465252a`** — new routes/agents not deployed.
- Production env is missing the now-required vars (`JWT_SECRET`, `JWT_API_KEY`, `GOOGLE_API_KEY`, `CORS_ORIGINS`).
- DB migrations may not all be applied to your Supabase.
- Frontend `VITE_API_URL` not set → pilot form can't reach API.
- Domain mismatch (`getdossier.co` in code vs `api.rundossier.co` deployed).

**Missing (genuine new code to write):**
- **Admin/visibility API**: list/inspect prospects, manually re-trigger research, retry failed jobs, inspect batches. None of these read endpoints exist yet.
- **Automated tests** (the `test` script is a stub).

**n8n workflows present:** exactly one — `workflow-10-dogfood.json`.

---

## 3. What to remove/replace from n8n

There is **one** workflow, and the backend already replaces every node. Mapping:

| n8n node (workflow-10) | What it does | Already-existing coded replacement |
|---|---|---|
| `Every 6 hours` (schedule trigger) | Fires every 6h | `boss.schedule('dogfood-scrape', '0 */6 * * *')` in `src/queue.ts` |
| `Dogfood scrape` (HTTP POST `/dogfood/scrape`) | Scrape Sales-Nav prospects | `src/jobs/dogfood-scrape.job.ts` (`runDogfoodScrape`) |
| `Promote top 30%` (HTTP POST `/dogfood/promote`) | Promote best prospects | `src/jobs/dogfood-promote.job.ts` (`runDogfoodPromote`), scheduled every 15 min |
| `Log funnel snapshot` (HTTP GET `/dogfood/funnel`) | Funnel metrics | `src/routes/dogfood.ts` `/dogfood/funnel` + `dogfood_funnel_events` table |

**Action: delete n8n entirely from the product path.**
1. Keep `DOGFOOD_ENABLED` unset/true so pg-boss runs the schedules (it already does).
2. Do **not** import `workflow-10-dogfood.json` into n8n. If it's already imported and active, **deactivate it** so you don't double-fire scrapes.
3. Delete the file: `git rm n8n/workflow-10-dogfood.json` (optional — keep it as documentation if you prefer, just don't run it).
4. The n8n container on the server can stay for unrelated experiments, but it is **not part of Preframe** anymore.

**Generalized mapping (for any future workflow you might be tempted to build in n8n):**

| n8n concept | Coded equivalent in this repo |
|---|---|
| Manual trigger | Express route (e.g. `POST /api/prospects/:id/research`) |
| Webhook trigger | Express route (e.g. `POST /api/intake`) |
| Schedule trigger | `boss.schedule('queue', 'cron')` in `src/queue.ts` |
| Code node | function in `src/services/*` or `src/utils/*` |
| Supabase node | `query()` in `src/db.ts` |
| HTTP Request node | typed client (e.g. `src/scrapers/*`, `src/utils/resend.ts`) |
| Anthropic node | `src/agents/research.agent.ts` / `personalize.agent.ts` |
| Apify node | `src/scrapers/linkedin.ts` etc. |
| Branch / filter | TypeScript `if`/control flow in the job handler |
| Retry logic | pg-boss retry options + `src/utils/retry.ts` |
| Error branch | `try/catch` → insert into `failed_jobs` |
| Execution history | `failed_jobs` + `ai_costs` + worker logs |
| Workflow status | `prospects.status` / `batches.status` columns |

---

## 4. Code-first architecture (target = mostly what you already have)

```
landing/ (Cloudflare Pages, React)  ──HTTPS──>  api.YOURDOMAIN (Traefik)
                                                     │
                                          RunDossier/ (Node/TS, Docker)
        ┌────────────────────────────────────────────┼───────────────────────────┐
        │ Express API (src/index.ts + src/routes/*)   │  pg-boss workers (src/jobs)│
        │  health / auth / pilot / intake / search    │  research, personalize,    │
        │  dogfood / [NEW] prospects, jobs/retry       │  delivery, scheduler,      │
        └──────────────────────┬───────────────────────  dogfood-*, prospect-search│
                               │ services/agents/scrapers/utils                     │
                               ▼                                                    │
                     Supabase Postgres (session pooler :5432)  <────────────────────┘
```

This matches your requested layered design (API → Service → Queue/Worker → DB). The naming differs slightly from your prompt's suggestions (you proposed `ProspectService`, `prospect.research.linkedin`; the repo uses agents + `research`/`personalize` queues). **Keep the existing names** — they work — and only add the missing admin endpoints. Renaming working code is risk with no payoff.

---

## 5. Phase-by-phase execution plan

### Phase 1 — Understand & stabilize (deploy current code)
**Goal:** the latest code runs in Docker on Hetzner.
**Steps:** see `DEPLOYMENT_ROADMAP.md` Phase 1 (merge to `main`, set full `.env`, `git pull`, `docker compose up -d --build`).
**New required env vars:** `JWT_SECRET` (≥32), `JWT_API_KEY` (≥16), `GOOGLE_API_KEY`, `CORS_ORIGINS`, `TRUST_PROXY=true`.
**Test:** `docker compose logs -f api` → `[queue] Started — jobs registered`; `curl https://api.YOURDOMAIN/health` → `{"status":"ok"}`.
**Errors:** `Missing or placeholder env var` (var unset), `JWT_SECRET must be at least 32 characters`.

### Phase 2 — Remove n8n from the product
**Goal:** dogfood pipeline runs from pg-boss only.
**Steps:** confirm `DOGFOOD_ENABLED` is on; deactivate/delete the n8n workflow; (optional) `git rm n8n/workflow-10-dogfood.json`.
**Test:** `docker compose logs api | grep dogfood` shows the scheduled job firing (every 6h) with no duplicate from n8n.
**Expected:** one source of truth for scraping.

### Phase 3 — Backend API completion (the real new code)
**Goal:** add the admin/visibility endpoints a SaaS dashboard needs. Create `src/routes/prospects.ts` + `src/routes/jobs.ts`, mount them in `src/index.ts` behind `requireJwt({ role: 'admin' })`.

| Method & path | Purpose | DB / queue |
|---|---|---|
| `GET /api/prospects?status=&limit=&offset=` | List prospects | `SELECT … FROM prospects` |
| `GET /api/prospects/:id` | One prospect + its first lines + signals | join `prospects`,`first_lines`,`prospect_signals_raw` |
| `POST /api/prospects/:id/research` | Re-enqueue research | set status `queued` → `boss.send('research', …)` |
| `POST /api/prospects/import` | Bulk import (wraps current `scripts/ingest-prospects.ts` logic into a service) | insert `prospects`, status `queued` |
| `GET /api/batches/:id` | Batch progress | `SELECT … FROM batches` + counts by status |
| `POST /api/jobs/retry` | Retry a `failed_jobs` row | read `failed_jobs`, re-`boss.send` the original queue |
| `GET /api/jobs/failed` | List failures for a dashboard | `SELECT … FROM failed_jobs` |

**Test each:** `curl -H "Authorization: Bearer <admin JWT>" https://api.YOURDOMAIN/api/prospects` → JSON list.
**Errors:** 401 (missing/invalid JWT), 500 (table missing → do Phase 5 first).

### Phase 4 — Queue & worker system (already built — verify, don't rebuild)
**Goal:** confirm the 7 queues run and retry correctly.
**Existing jobs:** `research`, `personalize`, `scheduler` (5 min), `delivery` (15 min), `dogfood-scrape` (6 h), `dogfood-promote` (15 min), `prospect-search` (daily 07:00).
**To add (small):** when a job throws, ensure it writes to `failed_jobs` with `prospect_id`, `job_name`, `error_message`, `stack`, `payload` (verify each handler does this; the table and pattern exist). Add pg-boss retry options (`retryLimit`, `retryBackoff`) on `boss.work`/`boss.send` for transient errors (Apify/Anthropic timeouts) but **not** for validation errors.
**Test:** `npm run ingest` then watch a prospect move `queued → research_in_progress → research_complete → personalization_in_progress → personalized_qa_passed`.

### Phase 5 — Database finalization
**Goal:** all tables present in Supabase. Apply in order: `schema.sql`, `triggers.sql`, `002`–`008`, `seeds/workflow-prompts.sql` (see `DEPLOYMENT_ROADMAP.md` Phase 2 for exact commands or paste into Supabase SQL Editor).
**Tables:** `prospects`, `prospect_signals_raw`, `prompt_versions`, `first_lines`, `ai_costs`, `failed_jobs`, `dogfood_funnel_events`, `smartlead_queue`, `pilot_requests`, `clients`, `batches`, `client_search_profiles`, `search_runs`.
**Optional new tables for your requested design:** `job_runs` (per-execution audit) and `exports` (export history) — not in the repo yet; add as migration `009_job_runs_exports.sql` only if you build the dashboard and want execution history.
**Test:** Supabase → Table Editor shows all tables; `npm run verify`.

### Phase 6 — AI & research pipeline (already coded — confirm quality)
**Goal:** end-to-end pipeline produces a stored, QA-passed first line.
**Flow (all code):** intake/import → `research` job (`research.agent.ts` + scrapers + Apollo) → signals stored in `prospect_signals_raw` → `personalize` job (`personalize.agent.ts`) → QA (`qa.agent.ts` via Gemini) → `first_lines` → `delivery` job emails/export.
**Cost tracking:** `cost-tracker.ts` writes `ai_costs` per call — verify rows appear.
**Test:** run one prospect through; confirm a row in `first_lines` with a confidence score ≥ `confidenceFloor` (60) and QA score ≥ `qaScoreFloor` (7).
**Errors:** thin research → status path for `thin_research`; LLM/Apify errors land in `failed_jobs`.

### Phase 7 — Deployment with Coolify (or keep manual)
**Goal:** one deployment, auto-redeploy on push. See `DEPLOYMENT_ROADMAP.md` Phase 1.1 + Phase 7. If using Coolify: Build Pack Dockerfile, **Base Directory `/RunDossier`**, Port `3000`, Domain `https://api.YOURDOMAIN`, env vars in the **Environment Variables tab** (not the `.env` file), branch `main`. **Pick Coolify OR the manual container — never both.**
**Redeploy after a push:** Coolify auto-deploys on GitHub webhook, or click **Deploy**. Manual: `git pull && docker compose up -d --build`.

### Phase 8 — Production readiness
- Rotate all secrets exposed earlier (Supabase pw, Anthropic, Apify, Telegram).
- `TRUST_PROXY=true`, rate limits already in `src/middleware/rate-limit.ts`, request validation in routes, security headers on.
- DB SSL: Supabase pooler `:5432` + `DATABASE_SSL_STRICT=false`.
- Monitoring: Telegram alerts (`src/notify.ts`) on fatal/`failed_jobs` spikes; uptime check on `/health`.
- Backups: Supabase automated backups (verify enabled); rollback = redeploy previous commit in Coolify.

### Phase 9 — Final launch checklist
See section 12 below.

---

## 6. File-by-file implementation checklist

| File | Action |
|---|---|
| `RunDossier/.env` (server) | **Set** all required vars (Phase 1) |
| `RunDossier/src/routes/prospects.ts` | **Create** — list/detail/re-research/import |
| `RunDossier/src/routes/jobs.ts` | **Create** — retry + list failed jobs |
| `RunDossier/src/services/prospect.service.ts` | **Create** — extract import/list logic from `scripts/ingest-prospects.ts` |
| `RunDossier/src/index.ts` | **Edit** — mount the two new routers behind `requireJwt({role:'admin'})` + rate limit |
| `RunDossier/sql/migrations/009_job_runs_exports.sql` | **Create** (optional) — `job_runs`, `exports` |
| `RunDossier/src/jobs/*.job.ts` | **Verify** each catch writes to `failed_jobs`; add retry options |
| `n8n/workflow-10-dogfood.json` | **Remove from product** (deactivate / delete) |
| `landing/` Cloudflare env | **Set** `VITE_API_URL` |
| `RunDossier/package.json` | **Add** real tests (replace stub `test`) |

---

## 7. Database checklist
- [ ] `schema.sql` + `triggers.sql` applied
- [ ] migrations `002`–`008` applied, `seeds/workflow-prompts.sql` loaded
- [ ] all 13 tables present (section 5)
- [ ] pg-boss schema auto-created (it is, on `boss.start()`)
- [ ] (optional) `job_runs`, `exports` added
- [ ] `npm run verify` passes

## 8. API checklist
- [ ] `GET /health` (exists)
- [ ] `POST /api/auth/token`, `GET /api/pilot/token`, `POST /api/pilot`, `POST /api/intake`, `/api/search`, `/dogfood/*` (exist)
- [ ] `GET /api/prospects`, `GET /api/prospects/:id`, `POST /api/prospects/:id/research`, `POST /api/prospects/import` (**build**)
- [ ] `GET /api/batches/:id` (**build**)
- [ ] `POST /api/jobs/retry`, `GET /api/jobs/failed` (**build**)

## 9. Worker / job checklist
- [ ] `research`, `personalize`, `scheduler`, `delivery`, `dogfood-scrape`, `dogfood-promote`, `prospect-search` all start (exist)
- [ ] each handler writes failures to `failed_jobs` with full context (verify)
- [ ] transient errors retry, validation errors don't (add retry options)
- [ ] dogfood runs from pg-boss only (n8n off)

## 10. Deployment checklist
- [ ] one deployment method only (manual **or** Coolify)
- [ ] Base Directory `/RunDossier`, Dockerfile pack, Port 3000
- [ ] domain + HTTPS via Traefik (no Caddy)
- [ ] env vars set in the right place (Coolify tab, or server `.env`)
- [ ] `git push` → redeploy works

## 11. Testing checklist
```bash
# local/docker
docker compose logs -f api            # queue started, app listening
curl http://localhost:3000/health     # {"status":"ok"}
# production
curl https://api.YOURDOMAIN/health
# auth
curl -X POST https://api.YOURDOMAIN/api/auth/token -H 'Content-Type: application/json' -d '{"apiKey":"<JWT_API_KEY>"}'
# pipeline
npm run ingest                        # import test prospects
npm run verify                        # pipeline health
# admin (after Phase 3)
curl -H "Authorization: Bearer <admin JWT>" https://api.YOURDOMAIN/api/prospects
curl -X POST -H "Authorization: Bearer <admin JWT>" https://api.YOURDOMAIN/api/jobs/retry -d '{"failedJobId":"..."}'
```

---

## 12. First 10 actions

1. Decide the product domain (`getdossier.co` vs `rundossier.co`); use it in `CORS_ORIGINS` + `VITE_API_URL`.
2. Merge latest code to `main`, `git push origin main`.
3. Generate `JWT_SECRET` (`openssl rand -hex 32`) + `JWT_API_KEY` (`openssl rand -hex 16`); get a Gemini key.
4. Write the full server `.env` (Phase 1) and `git pull && docker compose up -d --build`; confirm `[queue] Started`.
5. Apply DB migrations; verify all 13 tables in Supabase.
6. **Turn off n8n**: deactivate `workflow-10` so pg-boss is the only dogfood trigger.
7. Set `VITE_API_URL` in Cloudflare Pages; redeploy landing; test the pilot form end-to-end.
8. Build `src/routes/prospects.ts` + `src/routes/jobs.ts` (+ `prospect.service.ts`); mount in `index.ts`.
9. Run one prospect through the pipeline (`npm run ingest` → watch status → `first_lines` row).
10. Delete the failing Coolify app (keep one deployment), then rotate all exposed secrets.

# Preframe / RunDossier — Execution & Deployment Roadmap

_Last analyzed: 2026-06-14. Based on the actual repository state, not assumptions._

This roadmap takes you from "old code running, half-wired" to "current code live, frontend connected, jobs running." Follow the phases **in order**. Each step says what to do, which files/commands are involved, how to test, and what errors to expect.

---

## 0. The 3 things you must understand first

1. **Your deployed backend is STALE.** The container on Hetzner (`rundossier-api`) was built from commit `465252a`. Your real current code is much newer and adds: JWT auth, CORS, the `/api/pilot`, `/api/intake`, `/api/search` endpoints, the Gemini QA judge (W4.5), Apollo enrichment (W3), Resend email delivery (W5), and the prospect-search engine (W1). **None of that is live yet.**

2. **The current code refuses to start without new secrets.** `RunDossier/src/config.ts` → `validateConfig()` now *requires*: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (or `GEMINI_API_KEY`), `APIFY_TOKEN`, `JWT_SECRET` (≥32 chars), `JWT_API_KEY` (≥16 chars). The old container boots because old code only needed `DATABASE_URL`. When you deploy the new code with the old env, it will crash — by design.

3. **Domain mismatch — decide this now.** The frontend, `landing/DEPLOY.md`, and `landing/.env.example` are all built for **`getdossier.co`** (and `api.getdossier.co`). But you deployed the API at **`api.rundossier.co`**. Pick ONE product domain and use it everywhere. The rest of this plan assumes you choose one; wherever you see `api.YOURDOMAIN`, use your decision.

> **Decision needed (write your answer here): Product domain = `________________`**

---

## Part A — System-by-system current state

| System | Exists? | Gap / problem | Key files |
|---|---|---|---|
| **Backend/API** | Yes, fully wired | Stale build deployed; new routes not live | `RunDossier/src/index.ts`, `src/routes/*`, `src/middleware/*` |
| **Database/Supabase** | Schema + 8 migrations in repo | Unclear which migrations are applied to your Supabase; must apply all | `RunDossier/sql/schema.sql`, `sql/triggers.sql`, `sql/migrations/002-008`, `sql/seeds/workflow-prompts.sql` |
| **Env vars / auth** | Code ready (JWT, API key) | `JWT_SECRET`, `JWT_API_KEY`, `GOOGLE_API_KEY`, `CORS_ORIGINS` not set in production | `src/config.ts`, `src/utils/jwt.ts`, `src/routes/auth.ts` |
| **pg-boss / queue** | Working | Must stay on Supabase **session pooler :5432** (not :6543) | `src/queue.ts`, `src/db.ts`, `src/pg-ssl.ts` |
| **Apify** | Integrated (LinkedIn, Sales Nav, Apollo) | `APIFY_TOKEN` required; Sales-Nav scrape needs `APIFY_SALES_NAV_SEARCH_URL` + cookie | `src/scrapers/*` |
| **Anthropic/AI** | Integrated | `ANTHROPIC_API_KEY` required; **Gemini key now also required** | `src/agents/*`, `src/utils/gemini.ts` |
| **n8n** | 1 workflow exported (dogfood) | Calls backend HTTP endpoints; needs API URL + `DOGFOOD_API_TOKEN`. W2–W5 are in-code jobs, not n8n | `n8n/workflow-10-dogfood.json` |
| **Landing/frontend** | Yes, on Cloudflare | Calls backend via `VITE_API_URL` — not set → pilot form will fail | `landing/src/lib/api.js`, `landing/.env.example`, `landing/DEPLOY.md` |
| **Deployment** | Manual container live (old code) + a failing Coolify app | Two deployments of the same app = conflict risk; consolidate to ONE | `docker-compose.yml`, `RunDossier/Dockerfile` |
| **Domain/HTTPS/proxy** | `api.rundossier.co` works over HTTPS via Coolify's Traefik | Domain mismatch with frontend code | Cloudflare DNS, Traefik labels in `docker-compose.yml` |

**Required env vars (full list).** Required to boot: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (or `GEMINI_API_KEY`), `APIFY_TOKEN`, `JWT_SECRET`, `JWT_API_KEY`. Required for frontend: `CORS_ORIGINS`, and set `TRUST_PROXY=true` (you're behind Traefik). Optional by feature: `RESEND_API_KEY` + `DELIVERY_FROM_EMAIL` (W5 email), `APOLLO_API_KEY` (W3 enrich), `SMARTLEAD_API_KEY` + `SMARTLEAD_CAMPAIGN_ID` + `DOGFOOD_API_TOKEN` + `APIFY_SALES_NAV_SEARCH_URL` + `LINKEDIN_SALES_NAV_COOKIE` (dogfood pipeline), `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (alerts), `DATABASE_SSL_STRICT=false` (Supabase).

---

## Phase 1 — Stop the errors, get CURRENT code running

Goal: the latest code builds and boots in Docker on the server without crashing.

**1.1 Pick the deployment method (do not run both).**
You currently have two: the working **manual container** (`/opt/dossier/RunDossier`, old code) and a **failing Coolify app**. Choose one:
- **Recommended: keep the manual container** (it already works and is behind Traefik) and just update its code + env. Then **delete the Coolify app** to stop conflicts: Coolify UI → `rundossier-api` → Danger Zone → Delete.
- _Alternative:_ use Coolify and tear down the manual container — but then you must enter env vars in Coolify's Environment Variables tab (the step that kept failing). The manual route is lower-risk for you now.

**1.2 Make sure the deploy branch has the latest code.**
Your branches are messy (`main`, `ara`, and a case-duplicate `Ara`). On your own computer:
```bash
git checkout main
git merge ara          # if main is behind your working branch
git push origin main
```
Confirm `main` on GitHub shows your newest commit (currently `815f739`).

**1.3 Generate the two new secrets** (on the server or your machine):
```bash
openssl rand -hex 32   # use as JWT_SECRET (64 chars — OK, must be ≥32)
openssl rand -hex 16   # use as JWT_API_KEY (32 chars — OK, must be ≥16)
```
Save both somewhere safe.

**1.4 Write the complete `.env`** (manual deploy path). Edit `/opt/dossier/RunDossier/RunDossier/.env` so it contains **all required** vars:
```
DATABASE_URL=postgresql://postgres.ogsvhgsdfmcbzgwovcpy:NEWPASSWORD@aws-1-eu-central-2.pooler.supabase.com:5432/postgres
DATABASE_SSL_STRICT=false
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...                 # Gemini key — get at aistudio.google.com
APIFY_TOKEN=...
JWT_SECRET=<openssl rand -hex 32 output>
JWT_API_KEY=<openssl rand -hex 16 output>
CORS_ORIGINS=https://YOURDOMAIN,https://www.YOURDOMAIN
TRUST_PROXY=true
PORT=3000
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=7353767566
# Optional, enable as you turn features on:
# RESEND_API_KEY=...
# DELIVERY_FROM_EMAIL=deliveries@YOURDOMAIN
# APOLLO_API_KEY=...
# DOGFOOD_API_TOKEN=<openssl rand -hex 16>
# SMARTLEAD_API_KEY=...
# SMARTLEAD_CAMPAIGN_ID=...
```

**1.5 Pull latest + rebuild:**
```bash
cd /opt/dossier/RunDossier/RunDossier
git pull origin main
cd /opt/dossier/RunDossier
docker compose up -d --build
docker compose logs -f api
```

**Test:** logs show `[queue] Started — jobs registered` then `Preframe running on :3000`, and `docker compose ps` shows `Up (healthy)`.
**Errors to watch:** `Missing or placeholder env var: X` → that var is empty/missing in `.env`. `JWT_SECRET must be at least 32 characters` → regenerate. `self-signed certificate` → confirm `DATABASE_SSL_STRICT=false` and port `:5432`.
**Expected result:** current code boots with all routes mounted.

---

## Phase 2 — Database / Supabase

Goal: every table the new code needs exists in your Supabase database.

**2.1 Apply schema + migrations, in order.** Easiest is to run the repo's scripts from the server (they read `DATABASE_URL` from `.env`):
```bash
cd /opt/dossier/RunDossier/RunDossier
# base schema first (only if not already applied)
npx tsx -e "import {pool} from './src/db.js'; import {readFileSync} from 'fs'; await pool.query(readFileSync('sql/schema.sql','utf8')); await pool.query(readFileSync('sql/triggers.sql','utf8')); await pool.end(); console.log('base ok')"
npm run dogfood:migrate     # applies 002
npm run pilot:migrate       # applies 003
npm run workflow:migrate    # applies 004,005,006,007,008 + seeds/workflow-prompts.sql
```
_If `npx tsx` isn't available in the container, run these from your own machine with the same `DATABASE_URL`, or paste each `.sql` file into the Supabase SQL Editor in this order: `schema.sql`, `triggers.sql`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `seeds/workflow-prompts.sql`._

**Tables you should end up with:** `prospects`, `prospect_signals_raw`, `prompt_versions`, `first_lines`, `ai_costs`, `failed_jobs`, `dogfood_funnel_events`, `smartlead_queue`, `pilot_requests`, `clients`, `batches`, `client_search_profiles`, `search_runs` (+ pg-boss's own `pgboss` schema).

**Test:** in Supabase → Table Editor, confirm the tables above exist. Or run `npm run verify` (`scripts/verify-pipelines.ts`).
**Errors to watch:** `relation already exists` is usually safe (migrations use `IF NOT EXISTS`); a hard failure mid-file means stop and fix that file before re-running later ones.
**Expected result:** no "relation does not exist" errors when the app handles a request.

---

## Phase 3 — Domain, HTTPS, proxy (already mostly done)

Goal: the API is reachable over HTTPS on your chosen domain.

**3.1 If you keep `api.rundossier.co`:** it already works (Traefik labels in `docker-compose.yml`, Cloudflare A record grey-cloud, cert issued). Nothing to do except make sure `CORS_ORIGINS` matches your frontend domain.

**3.2 If you switch to `api.getdossier.co`:** add a Cloudflare A record `api` → server IP (DNS only / grey cloud) on the `getdossier.co` zone, then change the host in `docker-compose.yml` labels (replace both `` Host(`api.rundossier.co`) `` lines), and `docker compose up -d`. Wait ~60s for Traefik to issue the new cert.

**Test:** `https://api.YOURDOMAIN/health` returns `{"status":"ok"}` with a padlock.
**Errors to watch:** cert not issuing → DNS must be grey cloud (not orange) and resolve to the server; port 80 must stay owned by `coolify-proxy`.
**Expected result:** HTTPS health check passes from outside.

---

## Phase 4 — Connect the landing page (frontend ↔ backend)

Goal: the pilot/"FreeLines" form on the site actually talks to the API. `landing/src/lib/api.js` calls `/api/pilot/token`, `/api/pilot`, and `/api/auth/token` using `import.meta.env.VITE_API_URL`.

**4.1 Set the API URL in Cloudflare Pages:** Pages project → Settings → Environment variables → add `VITE_API_URL=https://api.YOURDOMAIN` → redeploy the Pages project.

**4.2 Make CORS match:** backend `CORS_ORIGINS` (Phase 1.4) must list the exact frontend origin(s), e.g. `https://getdossier.co,https://www.getdossier.co`. The pilot-token route also enforces origin via `src/utils/origin-check.ts`, so the origin must match.

**4.3 Confirm CSP allows the API:** `landing/public/_headers` already allows `connect-src ... https:`, so a real HTTPS API domain is fine. (If you ever pin it, add `https://api.YOURDOMAIN` there explicitly.)

**Test:** open the site → submit the pilot/FreeLines form → browser DevTools → Network: `GET /api/pilot/token` returns 200 with a token, `POST /api/pilot` returns 200. No CORS error in the console.
**Errors to watch:** `blocked by CORS policy` → origin missing from `CORS_ORIGINS`. `403 Forbidden` on `/api/pilot/token` → `origin-check` rejects it (origin not allowed). `Failed to fetch` → `VITE_API_URL` wrong or not rebuilt.
**Expected result:** form submission creates a row in `pilot_requests`.

---

## Phase 5 — Test API endpoints & background jobs

**5.1 Public/health:** `GET /health` → `{"status":"ok"}`.
**5.2 Admin token:** `POST /api/auth/token` with body `{"apiKey":"<your JWT_API_KEY>"}` → returns a JWT. Wrong key → 401.
**5.3 Intake (admin-only):** `POST /api/intake` with `Authorization: Bearer <admin JWT>` → 200. Without token → 401.
**5.4 Background jobs:** watch `docker compose logs -f api` for the scheduler ticking (`scheduler` runs every 5 min). Insert a test prospect with `npm run ingest` (`scripts/ingest-prospects.ts`, uses `scripts/prospects-batch.json`) and confirm a `research` then `personalize` job runs and a row lands in `first_lines`.
**Errors to watch:** jobs silently not running → pg-boss couldn't reach DB (check pooler port). LLM errors → bad `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY`. Apify errors → bad `APIFY_TOKEN` or actor not approved in Apify console.
**Expected result:** a prospect flows research → personalize → QA → a stored first line.

---

## Phase 6 — n8n workflow (dogfood)

`n8n/workflow-10-dogfood.json` is a scheduler that every 6h calls your backend: `POST /dogfood/scrape`, `POST /dogfood/promote`, `POST /dogfood/funnel`. Note: the backend **already** schedules these via pg-boss (`scheduler.job.ts`, `dogfood-scrape` every 6h), so n8n here is an optional/alternative trigger — don't run both or you'll double-fire.

**6.1 If you want n8n to drive it:** in n8n (already running on the server), import `workflow-10-dogfood.json`, set the HTTP nodes' base URL to `https://api.YOURDOMAIN`, and add the `DOGFOOD_API_TOKEN` as a Bearer header. Set the same `DOGFOOD_API_TOKEN` in the backend `.env` so `/dogfood/*` is protected. Then **disable the in-code dogfood schedules** (set `DOGFOOD_ENABLED=false`) to avoid double execution.
**6.2 If you want the backend to drive it:** leave `DOGFOOD_ENABLED` unset, set `APIFY_SALES_NAV_SEARCH_URL` + `LINKEDIN_SALES_NAV_COOKIE` (the Telegram error you saw was this missing), and don't import the n8n workflow.

**Test:** trigger `POST /dogfood/scrape` manually with the token → returns counts, rows appear in `smartlead_queue`.
**Expected result:** dogfood pipeline runs from exactly ONE place.

---

## Phase 7 — Production security & final launch checklist

- [ ] **Rotate all secrets exposed in chat:** Supabase DB password, Anthropic key, Apify token, Telegram bot token. New value in each dashboard → update `.env` → `docker compose up -d`.
- [ ] `TRUST_PROXY=true` set (correct client IP for rate limiting behind Traefik).
- [ ] `JWT_SECRET` ≥32 chars and **not** committed (it's in `.env`, which is gitignored — good).
- [ ] Only ONE backend running (manual **or** Coolify, not both). Delete the unused one.
- [ ] Cloudflare proxy: once everything works, you may switch `api` back to orange cloud with SSL mode **Full (strict)** for CDN/DDoS — optional.
- [ ] `npm run verify` passes.
- [ ] `/health` green, pilot form works end-to-end, one prospect processed successfully.

---

## Phase 8 — Post-launch improvements

- Move deployment to Coolify's auto-deploy-on-push once stable (so `git push` redeploys automatically).
- Split n8n onto its own resources if workflows get heavy (so they can't starve the API).
- Add a real test suite (`package.json` `test` is currently a stub).
- Clean up Git branches (`ara`/`Ara` case-duplicate is a footgun — delete one).
- Consider Supabase IPv4/direct-connection vs pooler depending on load.
- Add uptime monitoring on `/health`.

---

## ⭐ Do this next — first 10 actions

1. **Decide your product domain** (`getdossier.co` vs `rundossier.co`) and write it down.
2. On your computer: merge your latest code into `main` and `git push origin main`.
3. Generate `JWT_SECRET` (`openssl rand -hex 32`) and `JWT_API_KEY` (`openssl rand -hex 16`).
4. Get a **Gemini API key** (aistudio.google.com) for `GOOGLE_API_KEY`.
5. Rewrite `/opt/dossier/RunDossier/RunDossier/.env` with the full Phase 1.4 list.
6. `git pull origin main` in `/opt/dossier/RunDossier/RunDossier`, then `docker compose up -d --build` and confirm `[queue] Started`.
7. Apply DB migrations (Phase 2.1); verify tables in Supabase.
8. Set `VITE_API_URL` in Cloudflare Pages and redeploy the landing.
9. Test the pilot form end-to-end (Network tab + a row in `pilot_requests`).
10. **Delete the failing Coolify app** so only one backend runs, then rotate the exposed secrets.

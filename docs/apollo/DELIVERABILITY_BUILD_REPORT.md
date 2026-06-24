# Deliverability Build Report — Dossier (RunDossier)

**Date:** 2026-06-24 · **Scope:** audit + non-destructive build of a sending-readiness system.
**Verification:** `tsc --noEmit` clean across the project; deliverability unit suite **28/28 passing**. No emails sent; no credits spent; no DNS or sender settings changed.

---

## 1. Deliverability issues found (audit)

| # | Finding | Severity |
|---|---|---|
| 1 | No sender-domain model, readiness states, or send gate anywhere in the codebase | High |
| 2 | `pushToSmartlead()` (the cold-send path) had **no deliverability guard** — with Smartlead creds + a campaign it could send cold from any domain | High |
| 3 | getdossier.co is the **primary operating domain** (Google Workspace MX) yet was the implicit sender | High |
| 4 | **DKIM missing, DMARC missing** on getdossier.co (SPF present) | High |
| 5 | Mailbox ~10 days old; no warm-up tracking | Medium |
| 6 | No merge-field / opener-provenance validation before enrollment | Medium |
| 7 | No auto-pause on bounce/spam/blacklist/auth/credential failures | Medium |
| 8 | No separation of test vs. live sending | Medium |
| — | Already safe: Apollo enrichment + client CSV delivery are independent of cold sending; Smartlead currently dormant (unconfigured) | OK |

## 2. Files changed

**Created**
- `sql/migrations/026_sender_domains.sql` — `sender_domains` + `sender_domain_events` tables, RLS, seed.
- `scripts/apply-sender-domains-migration.ts` — migration runner.
- `src/services/deliverability/types.ts` — model, states, thresholds, `isTestMode`.
- `src/services/deliverability/readiness.ts` — pure state machine, gate, auto-pause, enroll/send decisions.
- `src/services/deliverability/merge-fields.ts` — merge-field + opener-provenance validation.
- `src/services/deliverability/sender-domains.repo.ts` — DB layer + state-change logging.
- `src/services/deliverability/sender-guard.ts` — server-side fail-closed enforcement.
- `src/services/deliverability/readiness.test.ts`, `merge-fields.test.ts` — 28 tests.
- `src/routes/deliverability.ts` — admin dashboard + JSON + primary-domain warning.

**Modified**
- `src/integrations/smartlead.ts` — `pushToSmartlead()` now passes the fail-closed gate first (returns `queued` when not allowed).
- `src/app.ts` — registers the deliverability routes.
- `package.json` — adds `deliverability:migrate`.

## 3. Database migration

`026_sender_domains.sql` (idempotent). Tables: **`sender_domains`** (all spec fields + `primary_override`, `limited_test_passed`, `scaled_approved`, `provider_warning`) and **`sender_domain_events`** (append-only state-change log). RLS enabled (server-only, matching migration 025). Seeds **getdossier.co** as `is_primary_domain=true`, `sending_readiness='blocked'`, `is_sending_paused=true`, DKIM/DMARC `missing`, SPF `pass`.
Apply (deployment access): `npm run deliverability:migrate`.

## 4. Environment variables added (all optional; safe defaults)

| Var | Default | Purpose |
|---|---|---|
| `DELIVERABILITY_LIVE_SENDING` | unset → **test mode** | Must be `true` to ever leave test mode. Absent = no live cold sends. |
| `COLD_SENDING_DOMAIN` / `SMARTLEAD_SENDER_DOMAIN` | unset | The approved dedicated cold domain the gate checks. |
| `DELIVERABILITY_MIN_MAILBOX_AGE_DAYS` | 14 | New-mailbox guard. |
| `DELIVERABILITY_MIN_WARMUP_DAYS` | 14 | Warm-up gate. |
| `DELIVERABILITY_MAX_BOUNCE_PCT` | 2 | Auto-pause + scale threshold. |
| `DELIVERABILITY_MAX_SPAM_PCT` | 0.1 | Auto-pause threshold. |
| `DELIVERABILITY_LIMITED_DAILY_MAX` | 20 | Cap while `limited_test_ready`. |
| `DELIVERABILITY_LIMITED_CONTACTS_MAX` | 10 | Default first-test batch size. |
| `DASHBOARD_TOKEN` | unset | Gates the admin dashboard (existing pattern). |

## 5. Admin dashboard

`GET /api/admin/deliverability?token=…` (HTML) and `…/deliverability.json`. Shows each sender's domain, role, SPF/DKIM/DMARC, **computed readiness** + reasons, mailbox age, warm-up, daily count/limit, bounce/spam, paused state, and recent state changes. Renders the required banner when a primary domain is present:
> *Primary operating domain detected. Do not use this domain for scaled cold outreach. Authenticate it for normal business email, then use a separate dedicated sending domain for outbound volume.*

## 6. Sender guards & auto-pause implemented

- **Send gate** (`coldSendAllowed`, `assertColdSendAllowed`): fail-closed; resolves the approved cold domain (never the primary) and runs `decideSend`. Wired into `pushToSmartlead`.
- **Enroll gate** (`guardEnrollProspect`): merge-field + opener-provenance validation **and** sender readiness.
- **Auto-pause** (`evaluateAutoPause`): pauses on bounce ≥2%, spam ≥0.1%, blacklist, provider warning, mailbox disconnect/invalid, missing auth on a cold domain, or daily-limit reached.
- **Readiness rules:** primary domain → `blocked` (unless admin `primary_override`); auth incomplete blocks `limited_test_ready`; new mailbox blocks `scaled_sending_ready`; scaled requires passed test + clean metrics + explicit `scaled_approved`.
- **Apollo decoupling:** `canEnrich()` is always true — enrichment never depends on sending readiness.
- **Logging:** every transition writes to `sender_domain_events` + the tamper-evident `audit_events` chain.

## 7. getdossier.co readiness state

**`blocked`** (and `is_sending_paused=true`).

## 8. Exact reasons it is NOT ready for scaled cold outreach

1. It is the **primary operating domain** (Google Workspace MX) — blocked by policy.
2. **DKIM missing** and **DMARC missing** (verified against live DNS 2026-06-24).
3. **Mailbox ~10 days old**, no warm-up.
4. No **dedicated cold-sending domain** exists yet.

## 9–12. Manual DNS / Workspace / DMARC / verification

Full step-by-step is in **`docs/apollo/DELIVERABILITY_SETUP.md`** (rewritten for the Cloudflare migration you chose). Summary:

- **9 — DNS records to add (in Cloudflare, after migrating NS from Wix):** re-create SPF (`v=spf1 include:_spf.google.com ~all`), the 5 Google MX, and the Google site-verification TXT; then add **DKIM** TXT at `google._domainkey` (value from Google) and **DMARC** TXT at `_dmarc` = `v=DMARC1; p=none; rua=mailto:dmarc-reports@getdossier.co; fo=1`.
- **10 — Google Workspace DKIM:** Admin → Gmail → Authenticate email → getdossier.co → generate **2048-bit**, selector `google` → publish the TXT in Cloudflare → Start authentication.
- **11 — DMARC mailbox:** create `dmarc-reports@getdossier.co` (or a DMARC service) **before** publishing the `rua`.
- **12 — Verify:** re-pull `google._domainkey` + `_dmarc` (I can do this), Google Admin shows *Authenticating*, and a Gmail test shows SPF/DKIM/DMARC = PASS.

## 13. Safe to do now
Run the migration, set env vars, deploy, view the dashboard, build lists, enrich via Apollo, draft sequences — all non-sending. The gate keeps cold sending off by default.

## 14. Must remain blocked
Real cold sends, enabling `DELIVERABILITY_LIVE_SENDING`, scaled outreach, any send from getdossier.co, and `scaled_sending_ready` — until the gates pass.

## 15. Requires your explicit approval
Spending Apollo credits, registering a cold-sending domain, changing DNS/nameservers, Google Workspace DKIM, and flipping live sending on.

## 16. Manual action checklist (grouped)

**Completed automatically (code, this session)**
- [x] Sender-domain model + migration · readiness state machine · auto-pause · send/enroll gates · Apollo decoupling · merge-field/opener validation · admin dashboard + warning · 28 passing tests · getdossier.co seeded as blocked.

**Requires Google Workspace access**
- [ ] Generate 2048-bit DKIM key (selector `google`) and Start authentication.
- [ ] Create `dmarc-reports@getdossier.co` mailbox/alias.

**Requires Cloudflare / DNS access**
- [ ] Add getdossier.co to Cloudflare; re-create SPF, MX×5, site-verification, site A/CNAME.
- [ ] Switch registrar nameservers Wix → Cloudflare.
- [ ] Add DKIM TXT (`google._domainkey`) and DMARC TXT (`_dmarc`, `p=none`).

**Requires domain-purchase approval**
- [ ] Register + configure a dedicated cold-sending domain (Step 4).

**Requires deployment access**
- [ ] `npm run deliverability:migrate` on the production DB; set env vars; deploy.

**Requires paid provider access**
- [ ] Apollo paid plan (DB prospecting / A-B testing — both gated on the free plan).
- [ ] Cold-email sequencer + warm-up tooling for the dedicated domain.

**Blocked pending manual action**
- [ ] Cold sending, `limited_test_ready`, and `scaled_sending_ready` (need DKIM+DMARC pass, dedicated domain, warm-up, and explicit approval).

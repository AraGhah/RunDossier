# Apollo Launch Readiness — Dossier

**Generated:** 2026-06-24 · **Owner:** Ara Ghahramanyan (ara@getdossier.co)
**Apollo team:** 69ef9b96f6d770000d7cdf24 · **User:** 69ef9b97f6d770000d7ce095 · **Plan:** Free
**Overall sending readiness:** `not_ready` (DKIM + DMARC missing; primary operating domain; new mailbox)

> Safety: nothing in this account sends, enrolls real contacts, or spends material credits without Ara's explicit approval. See §8.

---

## 1. Current state (audit)

| Item | State | Detail |
|---|---|---|
| MCP connection | ✅ Live | OAuth, Apollo MCP |
| Sending mailbox | ✅ Linked | ara@getdossier.co (Gmail/Workspace), **default sender**, linked ~2026-06-14 |
| Credits | ✅ | 95 lead · 160 direct-dial · 5,000 AI · 0 export |
| Context Center ICP | ✅ **Published** | Profile `6a3c03f4250bde000c2f159d` (icp `6a3c03f4250bde000c2f159e`), `approved=true` |
| Product profile | ✅ **Published** | `6a3c0403cc58a6000cf40aa4` — "Done-for-You Prospect Research & Personalization" (default) |
| Sequence | ⏸ **Inactive draft** | "Dossier — Outbound Agencies & B2B SaaS (Cold → Fit Call)" `6a3c0500335ed40010812f0e`, 4 email steps |
| People DB search | ⛔ Plan-gated | `API_INACCESSIBLE` on free plan |
| A/B testing | ⛔ Plan-gated | `ab_testing_limit` on free plan |

## 2. What was published, and the data behind it

- **Published on 2026-06-24:** the ICP profile and the default product profile (set `approved=true`).
- **Data source:** Ara's written description of Dossier in this session (offer, ideal customer, pain, value prop, differentiators, competitors, proof posture, CTA). No external scraping; no invented figures.
- **Integrity checks applied before publishing:** verified the ICP reflects real intended buyers; verified the product reflects the real offer (research-grade sourcing, verified signals, personalized openers, delivery-ready outbound data); removed vague/generic claims; **explicitly not positioned as generic AI personalization**; no fabricated client names or metrics (none are public yet).
- **Versioned record:** mirrored to `docs/apollo/icp-product-record.v1.json` so future client campaigns can reference a synced, versioned source of truth.

## 3. Sending-readiness assessment

**State: `not_ready`.** Reason: email authentication is incomplete **and** the connected mailbox is the primary operating domain on a newly linked inbox.

| Check | Result | Notes |
|---|---|---|
| SPF | ✅ Pass | `v=spf1 include:_spf.google.com ~all` |
| DKIM | ❌ Missing | No record at `google._domainkey.getdossier.co` (default Google selector) |
| DMARC | ❌ Missing | No `_dmarc.getdossier.co` record (NXDOMAIN) |
| MX | ⚠️ Google Workspace | `aspmx.l.google.com` + alts → **getdossier.co is the primary mailbox/operating domain** |
| Dedicated cold domain | ❌ None | Sending would come from the primary domain |
| Mailbox age | ⚠️ New | Linked ~2026-06-14 (~10 days) |
| Warm-up | ❌ None evident | — |
| DNS host | ℹ️ Wix | `ns6.wixdns.net` — DNS changes are made in Wix |
| Domain age | ❓ Unverified | RDAP unavailable from this environment — confirm at registrar |

**Primary-domain risk: HIGH.** Cold-email volume from getdossier.co risks the deliverability of the domain the business actually runs on (Workspace email, replies, client comms).

### Readiness state machine

| State | Meaning | Entry criteria |
|---|---|---|
| `blocked` | Must not send | Provider/spam block, blacklist, or hard policy failure |
| `not_ready` | **Current** | Auth incomplete (DKIM/DMARC) or sending from primary domain with no warm-up |
| `warming` | Warm-up in progress | DKIM+DMARC live; dedicated domain in warm-up; no scaled sending |
| `limited_test_ready` | Tiny approved tests only | DKIM+DMARC pass; mailbox warmed ≥2 wks; 5–10 contacts, 10–20/day |
| `scaled_sending_ready` | Ramp allowed | Limited tests pass (bounce/spam/reply within thresholds), reputation stable |

### Path from `not_ready` → `limited_test_ready`
1. **Enable Google Workspace DKIM** (2048-bit) and publish the selector TXT in Wix DNS.
2. **Publish DMARC** at `_dmarc.getdossier.co`, start `p=none` with a `rua` reporting mailbox; tighten later.
3. **Strongly recommended:** use a **dedicated cold-sending domain or subdomain** (not getdossier.co) with its own SPF/DKIM/DMARC, redirected to the main site. *Do not purchase/register without Ara's explicit approval.*
4. **Warm up** the sending mailbox 2–4 weeks before cold volume.
5. Only then run a **limited test** (§6).

### Conservative limits (earliest stage, once approved)
| Stage | Contacts | Emails/day | Advance when |
|---|---|---|---|
| First deliverability test | 5–10 | 10–20 | 0 hard bounces, no spam/provider warnings, normal opens/replies |
| Early ramp | +10–25/wk | step up gradually | bounce <2%, spam ~0, replies healthy |

**Auto-pause triggers:** elevated bounces, provider/spam warnings, blacklist hit, or any deliverability failure → pause immediately and re-assess.

## 4. Prospecting paths

### Path A — Bring-your-own-list + Apollo enrichment (DEFAULT, available now)
Accepts: names+companies, company domains, LinkedIn URLs, CSV, account lists, manually selected targets.
Rules:
- **Estimate before running:** expected contacts, expected credit use (1 credit/match, 0 if unmatched), available balance (95), and a configured batch cap.
- **Do not enrich** duplicates, suppressed, invalid, out-of-ICP, or already-sufficiently-verified rows.
- Prioritize **email verification** + essential prospect fields.
- **Validation batch first:** default 5–10 contacts before the full list.
- **No bulk enrichment without explicit batch approval.**
- Track: enriched, missing-data, failed, credits used, verified-email outcomes.

### Path B — Net-new Apollo database discovery (BLOCKED)
- Detected `API_INACCESSIBLE` (people search) on the free plan. **Do not retry the endpoint.**
- Unblocks only with a paid plan + permissions. Kept separate from enrichment so cost/performance are measured independently.

## 5. Personalization & merge-field architecture

**Do not enable Apollo's generic AI personalized opener for Dossier campaigns.** Dossier's edge is research-grade, signal-based personalization.

Approved variables: `{{first_name}}`, `{{company}}`, `{{title}}`, `{{research_signal}}`, `{{personalized_opener}}`, `{{bridge}}`, `{{subject_line_a}}`, `{{subject_line_b}}`.

Rules:
- `personalized_opener` comes only from Dossier's research + QA pipeline; **every opener carries a traceable source URL + research record.**
- Never substitute generic Apollo AI copy for the Dossier opener.
- Disallow unsupported merge fields from being sent; validate render on the test batch; **flag empty/broken variables before enrollment or CSV delivery.**
- Apollo-native merge supports `first_name`/`company`/`title`. The Dossier custom variables (`research_signal`, `personalized_opener`, `bridge`, `subject_line_*`) require Apollo **contact custom fields** or **CSV columns** when sending from Dossier/an external ESP.
- **A/B subject test** lives at the export layer (`subject_line_a` / `subject_line_b`) because Apollo A/B is plan-gated. Assign variants evenly + deterministically; track delivered/opened/replied/bounced/unsub/positive-reply per variant; **no statistical claims on tiny samples**; keep subject testing separate from opener-quality measurement; persist the chosen variant in the prospect/delivery record.

## 6. Controlled test workflow (5–10 approved contacts) — must pass before scale
- [ ] target list imported correctly
- [ ] Apollo enrichment maps correctly into Dossier prospect records
- [ ] Dossier research + personalization complete
- [ ] custom variables render correctly
- [ ] personalized openers have valid source records
- [ ] subject lines render correctly
- [ ] email body formatting correct
- [ ] unsubscribe + suppression rules work
- [ ] sender identity correct
- [ ] no required merge field blank
- [ ] no duplicate contacts enrolled
- [ ] no unexpected bounce / provider rejection
- [ ] delivery + activity events logged correctly

## 7. Apollo launch checklist

| Item | Status |
|---|---|
| ICP + product published | ✅ completed automatically |
| Apollo API/connection configured + validated | ✅ completed automatically |
| API health check passing | ✅ completed automatically |
| Primary-domain risk reviewed | ✅ completed automatically (HIGH) |
| SPF / DKIM / DMARC reviewed | ✅ completed automatically (SPF ok; DKIM+DMARC missing) |
| Current credit balance recorded | ✅ completed automatically (95 lead) |
| Sender mailbox verified | ✅ completed automatically (linked, default) |
| Prospecting permissions confirmed | ✅ completed automatically (DB search gated; enrichment available) |
| DKIM enablement (Workspace + Wix DNS) | requires domain or DNS access |
| DMARC publish (Wix DNS) | requires domain or DNS access |
| Dedicated cold domain/subdomain | requires domain or DNS access + explicit approval |
| Suppression / unsubscribe handling configured | requires my Apollo dashboard access |
| Enrichment test completed | requires explicit approval before spending credits |
| Batch credit cap configured | requires explicit approval (propose a default) |
| Merge fields tested | blocked — pending test batch |
| Dossier custom opener field verified | requires production deployment access (Dossier pipeline) |
| A/B subject variants configured | requires a paid Apollo feature or plan (handled at export layer instead) |
| Webhook configured + verified | not applicable yet (no webhook layer) |
| Test-list batch completed | blocked — pending DKIM/DMARC + approval |
| Real sending explicitly approved | blocked — awaiting Ara |
| Scale-readiness status confirmed | `not_ready` |

## 8. Safety state — paused, awaiting explicit approval

Will **not** do without Ara's explicit go-ahead: publish/activate live sequences, send real cold email, enroll real contacts, spend material Apollo credits (enrichment), alter DNS, purchase/register domains, or change sender settings.

Safe to proceed without sending: account config, draft sequences, validation logic, dashboards, test-mode workflows, documentation.

## Appendix — raw DNS evidence (2026-06-24, via DNS-over-HTTPS)
```
TXT  getdossier.co            v=spf1 include:_spf.google.com ~all
TXT  getdossier.co            google-site-verification=ravRHKe4pBnBb-dlycV_mqHB9JhA4WSH-FuRMi5TbyI
TXT  _dmarc.getdossier.co     NXDOMAIN (no DMARC record)
TXT  google._domainkey...     NXDOMAIN (no DKIM on default Google selector)
MX   getdossier.co            10 aspmx.l.google.com / 20 alt1 / 30 alt2 / 40 alt3 / 50 alt4 (Google Workspace)
NS   getdossier.co            ns6.wixdns.net (Wix-hosted DNS)
```

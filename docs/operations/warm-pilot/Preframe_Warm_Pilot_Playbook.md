# Preframe — Warm Pilot Playbook (SOP)

**Step:** Manually DM 10 warm-ish contacts a free-pilot offer.
**Why now:** Cold outbound isn't ready — Smartlead inboxes are still warming
(your `smartlead_queue` is empty by design). Warm pilots validate the product and
produce the case studies that make cold convert. This is a **manual, relationship-first**
motion, fully separate from cold sending.

**Done when:** 10 personalized pilot offers are sent and every reply is logged.

---

## 1. Build the list of 10 (warm-ish = friends-of-friends count)

Use the **Sourcing** tab in the tracker. A contact qualifies if you can answer
"how do we know each other?" in one honest sentence. Score each 1–5 and take your
top 10.

**Warmth rubric (1–5):**
- **5** — You've talked directly; they'd reply to your name today.
- **4** — 1st-degree connection or past colleague; light prior contact.
- **3** — True friend-of-friend: a mutual would intro you. *(sweet spot)*
- **2** — 2nd-degree, engaged with your content, no direct contact.
- **1** — Cold-ish. Don't use for this step.

**Where to find them:** your LinkedIn 1st-degrees in sales/outbound; people mutuals
have introduced; founders/operators you've DMed before; sales/cold-email communities
(Slack/Discord/X); past coworkers now in RevOps/SDR roles; agency owners you follow.

**Fit personas (match to a message variant A–J):** cold-email/lead-gen agency
founder (A), DFY/SDR agency owner (B), Head/VP Sales at small SaaS (C), SDR/BDR
lead (D), RevOps/Sales Ops (E), early-stage SaaS founder doing own outbound (F),
freelance appointment setter (G), fractional CRO/consultant (H), GTM/growth
marketer (I), peer/community builder (J).

---

## 2. Send (LinkedIn DM first, email backup)

1. Open `messaging/Preframe_Pilot_DM_Templates.md`.
2. Pick the variant matching the persona; replace `{{warm_hook}}` and `{{mutual}}`
   with the **real** context. Never send a template unedited.
3. Send the LinkedIn DM. If no LinkedIn or no reply in ~4 days, send the email version.
4. Log the send in the **Funnel** tab immediately (status `contacted`, set
   `Contacted (date)`, `Channel`, `Variant`, `Owner`).

**Hard guardrails**
- Manual only. Do **not** push these through Smartlead/cold inboxes (warmup running).
- One person at a time, personalized. No blasting.
- Always be honest you're testing the pipeline and want feedback.
- Max **two** follow-ups, then stop. Protect the relationship.

---

## 3. Track every reply (the funnel sheet → database)

The funnel lives in two synced places:
- **Working copy:** `Preframe_Pilot_Funnel_Tracker.xlsx` (Funnel tab + live Dashboard).
- **Source of truth:** Supabase `public.pilot_requests` (already in your product).

Status ladder (matches the DB `status` CHECK constraint):
`new → contacted → in_progress → delivered → closed`

Plus a finer `Outcome` column for reporting:
`pending · no_response · replied · call_booked · pilot_accepted · pilot_delivered · case_study · referral · declined`

Update the row the same day anything happens. Reply → set `Replied (date)` +
`Reply sentiment` + move status to `in_progress`. Pilot shipped → `Pilot sent (date)`
+ status `delivered`. Wrote a testimonial → `Outcome = case_study`.

### Syncing the sheet into Supabase
The loader is idempotent — run it as often as you like; it updates rows, never
duplicates, and blank cells never overwrite existing data.

```bash
cd loader
cp .env.example .env          # fill in SUPABASE_URL + SERVICE ROLE key
pip install -r requirements.txt

# 1) validate + preview (no writes)
python load_pilot_contacts.py --file ../Preframe_Pilot_Funnel_Tracker.xlsx --sheet Funnel --dry-run

# 2) real sync
python load_pilot_contacts.py --file ../Preframe_Pilot_Funnel_Tracker.xlsx --sheet Funnel
```

You can also keep contacts in `data/pilot_contacts_template.csv` and load that file
instead. The loader maps friendly headers automatically and validates emails,
statuses, channels, sentiment, outcome, and warmth before writing.

> **Security:** the loader needs the **service-role** key because the upsert RPC is
> restricted to `service_role`. Keep that key server-side only — never in a browser,
> the tracker, or a committed `.env`.

---

## 4. Convert pilots into case studies (the actual point)

For every pilot that lands:
1. Capture the baseline (their current opener reply rate, even if rough).
2. Deliver 50–100 personalized first lines; have them run a clean head-to-head.
3. Record the result number. A single believable "X% → Y% reply rate" beats any
   amount of marketing copy.
4. Ask for a 2–3 sentence testimonial + permission to use their name/logo. Mark
   `Outcome = case_study` and `status = closed`.
5. These quotes become the social proof in your cold sequences once warmup finishes.

**Target:** ~10 sent → a few pilots accepted → 2–3 usable case studies. That's a
successful round.

---

## 5. Definition of done (this step)
- [ ] 10 warm contacts chosen and scored in the Sourcing tab.
- [ ] 10 personalized offers sent (LinkedIn DM, email backup), each logged `contacted`.
- [ ] Tracker synced to `pilot_requests` via the loader (dry-run clean, then live).
- [ ] Replies logged as they arrive; follow-ups capped at two.

---

## Appendix — security finding (surfaced during this work)
Supabase's advisor flags **6 tables with Row Level Security disabled**:
`delivery_events, telegram_updates, telegram_command_log, workflow_runs,
audit_events, onboarding_events`. With RLS off, anyone holding the public anon key
can read/write those rows. `pilot_requests` itself already has RLS enabled.
Review and (if these are server-only) run `db/security/rls_advisory_fix.sql`.
Not applied automatically because enabling RLS without policies blocks all access —
that's your call to make.

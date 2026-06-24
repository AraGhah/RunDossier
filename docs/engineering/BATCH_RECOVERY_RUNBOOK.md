# Batch Recovery Runbook — get the stuck batch flowing again

From the 22:00 hourly digest: `dead_letter: 463`, `delivered: 284`, `thin_research: 131`, `ready: 20`, `active: 0`, Gemini credits still depleted (21:55), and delivery failing with `no_email_provider_configured` (22:00).

Do these **in order**. Steps 1–3 are environment/billing actions only you can do; step 4 is the script I wrote.

## 1. Restore Google AI (Gemini) credits — the root blocker
- Top up at https://ai.studio (Billing / prepay). The QA judge is Gemini; while it's out of credits every prospect fails QA.
- Verify: a test QA call succeeds, or new prospects stop logging "prepayment credits are depleted".

## 2. Configure an email provider — unblocks the 20 (and future) deliveries
`no_email_provider_configured` means delivery has no way to send. Pick one in `RunDossier/.env`:

**Resend (matches your earlier setup):**
```
RESEND_API_KEY=re_xxx
DELIVERY_FROM_EMAIL=deliveries@getdossier.co   # domain must be verified in Resend
DELIVERY_REPLY_TO=ara@getdossier.co
```
**or Gmail SMTP:**
```
GMAIL_USER=you@getdossier.co
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx          # Google App Password, not your login
DELIVERY_EMAIL_PROVIDER=gmail
```
**Interim (no email, finalize CSV only):**
```
DELIVERY_CSV_ONLY=true
```
> Note: your earlier delivery (the 44) *did* send, so a key was removed/expired. Resend also needs the From-domain verified — relevant since getdossier.co DNS is mid-migration to Cloudflare.

## 3. Deploy the provider-outage fix — so this can't recur
The digest still shows the **old** behavior (dead-lettering on the Gemini outage). My fix only takes effect after a rebuild + restart:
```
cd RunDossier
npm run build
# restart the worker process:
pm2 restart all        # or: docker compose up -d --build
```
After this, a provider outage leaves prospects **retryable** (not dead-lettered), and delivery **holds** until everything is resolved instead of shipping a partial.

## 4. Recover the 463 dead-letters — script (run AFTER steps 1–3)
```
cd RunDossier
# preview (safe, no changes) — scope to the outage window:
tsx scripts/recover-dead-letters.ts --since=2026-06-24

# apply once the preview looks right:
tsx scripts/recover-dead-letters.ts --since=2026-06-24 --apply

# if you'd rather reset EVERY dead-letter in the window (not just outage-signature):
tsx scripts/recover-dead-letters.ts --since=2026-06-24 --all --apply
```
- Dry-run by default; only flips rows currently in `dead_letter`; idempotent.
- Resets matched prospects to `research_complete` so they **re-personalize** (research is reused). Use `--reset-to=queued` to redo research too.
- The scheduler then re-processes them in safe chunks. With credits restored + the fix deployed, they complete instead of dying.

## 5. Validate
- Watch the next hourly digest: `dead_letter` stops growing, `active`/`ready` rise, `delivered` increases.
- `GET /api/parent-batches/<id>` (if the job runs under a parent batch) shows counts advancing to completion.
- Confirm a delivery email actually arrives (step 2 working).

## Why all four are needed
Credits (1) is the trigger; the email provider (2) is a separate, newer blocker that stops *delivery* even for healthy prospects; the deploy (3) stops the bleeding (no more permanent dead-letters from outages); the recovery script (4) heals the 463 already lost to the old behavior. Miss any one and the batch still won't fully deliver.

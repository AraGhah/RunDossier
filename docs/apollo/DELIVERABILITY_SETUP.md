# Deliverability Setup — getdossier.co (DNS → Cloudflare)

**Updated:** 2026-06-24 · Mail: **Google Workspace** · DNS today: **Wix** (`ns6/ns7.wixdns.net`) → migrating to **Cloudflare**

**Verified state (live DNS):** SPF ✅ `v=spf1 include:_spf.google.com ~all` · DKIM ❌ missing · DMARC ❌ missing · MX = Google Workspace (so getdossier.co is the **primary operating mailbox domain**) · mailbox ~10 days old → readiness **`not_ready`**.

> I do not change DNS, buy domains, or modify Google settings. Everything below is for you to execute. When records are live, tell me and I'll re-pull them to confirm pass/alignment.

---

## Step 0 — Migrate DNS from Wix to Cloudflare (do this first, carefully)

The migration must not break your existing mail. Re-create every current record in Cloudflare **before** flipping nameservers.

1. In **Cloudflare → Add a site → getdossier.co** (Free plan is fine). Cloudflare auto-scans and imports existing records.
2. **Verify the import** against what's live today. These must all be present in Cloudflare before you switch:
   - **MX** (5 records, Google): `aspmx.l.google.com` (priority 1 or 10), `alt1` (5/20), `alt2` (5/30), `alt3` (10/40), `alt4` (10/50). Keep the same priorities you have now (10/20/30/40/50).
   - **TXT (SPF):** `v=spf1 include:_spf.google.com ~all`
   - **TXT (Google site verification):** `google-site-verification=ravRHKe4pBnBb-dlycV_mqHB9JhA4WSH-FuRMi5TbyI`
   - **A / CNAME** for your website + landing (whatever currently serves getdossier.co and www). Confirm the site still resolves after migration.
   - Set MX and all mail-related TXT records to **DNS only** (grey cloud) — Cloudflare must not proxy them.
3. At your **domain registrar**, replace the Wix nameservers with the two Cloudflare nameservers Cloudflare shows you.
4. Wait for Cloudflare to email "getdossier.co is active" (minutes–hours). Confirm mail still flows and the site loads before continuing.

---

## Step 1 — DKIM (Google Workspace → Cloudflare)

1. **admin.google.com → Apps → Google Workspace → Gmail → Authenticate email**.
2. Select **getdossier.co** → **Generate new record** → **2048-bit**, selector **`google`**. Copy the `v=DKIM1; k=rsa; p=…` value.
3. In **Cloudflare DNS → Add record**: Type **TXT**, Name **`google._domainkey`**, Content = the full value from Google, **DNS only**.
4. Back in Google Admin → **Start authentication** (status → *Authenticating email*; can take up to ~48h).

> The DKIM key must come from your Google account — it is never hardcoded here.

## Step 2 — DMARC (Cloudflare, monitor-only first)

1. **First create the reporting mailbox/alias** `dmarc-reports@getdossier.co` (or point `rua` at a DMARC service you control). Do not publish a `rua` address that doesn't exist.
2. **Cloudflare DNS → Add record**: Type **TXT**, Name **`_dmarc`**, Content:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc-reports@getdossier.co; fo=1
   ```
3. **Staged roadmap — do not skip ahead:**
   - `p=none` while monitoring (start here)
   - review aggregate reports for **1–2 weeks**
   - move to `p=quarantine` only after SPF/DKIM alignment is clean
   - move to `p=reject` only after confirmed stable alignment

## Step 3 — SPF (leave as one record)

- Current SPF is correct for Workspace. **Exactly one** SPF TXT record must exist — do not add a second.
- Do **not** add a cold-email provider's `include:` to getdossier.co's SPF — you are not cold-sending from this domain.
- Watch the SPF 10-DNS-lookup limit if you later add includes (Google's `_spf.google.com` uses several).

---

## Step 4 — Dedicated cold-sending domain (before ANY cold volume; needs your approval to buy)

getdossier.co carries your Google Workspace mail — never run cold volume from it. Use a separate domain.

1. **Register** a variant (e.g. `trydossier.com`, `dossiermail.com`) — *do not purchase without explicit approval.*
2. **301-redirect** it to `https://getdossier.co`.
3. **1–3 sending mailboxes** on it (Google Workspace or a cold-email platform).
4. **Full auth on the new domain:** SPF (`-all`), DKIM (2048-bit), DMARC (`p=none` → tighten).
5. **Warm up 2–4 weeks** before real sends.
6. **Optional:** custom tracking domain if your sequencer needs it.
7. Register the domain in Dossier as a `sender_domain` with `is_cold_sending_domain = true`; the readiness engine gates it from there.

---

## Verify after changes (I can run these for you)
- DKIM: `google._domainkey.getdossier.co` TXT returns the `v=DKIM1…` key
- DMARC: `_dmarc.getdossier.co` TXT returns the `v=DMARC1…` record
- Google Admin shows DKIM *Authenticating email*
- Send a test to a Gmail address → **Show original** → SPF / DKIM / DMARC = **PASS**
- Cross-check with MXToolbox or dmarcian

**Tell me when DKIM + DMARC are published and I'll re-pull the live records to confirm they pass and align — that's what moves getdossier.co out of `not_ready` for business email (cold volume still requires the dedicated domain in Step 4).**

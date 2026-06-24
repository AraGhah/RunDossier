# Apollo — Free-Plan Setup & First-Client Go-Live

**Updated:** 2026-06-24 · Account: ara@getdossier.co · Plan: **Free** · Credits: **110 lead · 160 dial · 5,000 AI** (0 used)

Goal: squeeze everything possible out of the free plan now; upgrade only when the first client signs.

---

## ✅ Done on the free plan (live in Apollo)

| Item | Status |
|---|---|
| Context Center ICP — "Outbound Agencies & B2B SaaS" | **Published** |
| Product profile — "Done-for-You Prospect Research & Personalization" (default) | **Published** |
| Sending mailbox — ara@getdossier.co (Gmail) | Connected, default sender |
| Sending schedule — "Normal Business Hours" (Mon–Fri 8am–5pm, **sent in each contact's local timezone**, holidays skipped) | Default, governs all sequences |
| Sequence 1 — "Dossier — Outbound Agencies & B2B SaaS (Cold → Fit Call)" · 4 steps, pain-led | **Inactive draft** |
| Sequence 2 — "Dossier — Signal-Led (High-Fit, 3-step)" · signal-led, shorter | **Inactive draft** |

Both sequences are linked to your product profile, Direct tone, and send **nothing** until you load contacts, finish deliverability, and explicitly activate.

## 🛠️ Manual UI to-dos (Apollo has no API for these)

These can't be created via the API — do them in the Apollo web app (Settings → ... ), 5 minutes total:

1. **Custom contact fields** (Settings → Custom Fields) — create as **text** unless noted, so your researched data has a home and can be used as merge variables:
   - `personalized_opener` (text) — the Dossier-researched opening line
   - `research_signal` (text) — the specific signal used
   - `bridge` (text) — the transition line
   - `subject_line_a` (text), `subject_line_b` (text) — subject variants
   - `opener_source_url` (text) — provenance for the opener (required by your pipeline)
   > These match the fields your RunDossier code validates before enrollment.
2. **Contact lists / labels** (created when you add contacts, or via Lists) — e.g. `Client: <name>`, `Pilot batch`, `Do-not-contact`. Labels can't be pre-created empty via API; they appear when applied to contacts.
3. **Optional — upgrade the opener**: once `personalized_opener` exists, edit Sequence step 1 to lead with `{{personalized_opener}}` (with a safe fallback). Until then the sequences use standard vars (`{{first_name}}`, `{{company}}`) and read fine.

## 🔒 Still gated by the free plan (needs upgrade — defer until first client)

- **Net-new people-database prospecting** (search by title/industry/geo) — `API_INACCESSIBLE`
- **A/B subject testing** in sequences — `ab_testing_limit`
- Likely also company-database search and personal-email reveal

You don't need any of these to land the first client — you can enrich your own target lists with the 110 credits you already have.

## 🚀 First-client go-live checklist (when you sign + upgrade)

1. **Deliverability** (see `DELIVERABILITY_SETUP.md`): finish the Cloudflare migration + DKIM/DMARC, stand up a **dedicated cold-sending domain**, warm it 2–4 weeks. Never send cold from getdossier.co.
2. **Contacts in**: give me the client's target list (names+companies / domains / LinkedIn URLs) → I enrich to verified emails (~1 credit each, ≤110) → label them `Client: <name>`. Or import a CSV.
3. **Custom fields + opener**: create the fields above; map your researched opener into `personalized_opener`.
4. **Pick a sequence**: pain-led 4-step for cold, or signal-led 3-step for high-fit. Set the sender to the dedicated cold domain.
5. **Test batch**: enroll 5–10 contacts **paused**, verify merge fields render and nothing bounces, then activate. The RunDossier gate enforces this automatically.
6. **Upgrade Apollo** when you want net-new database prospecting + A/B testing at scale.

## Reference IDs
- ICP profile: `6a3c03f4250bde000c2f159d` · Product: `6a3c0403cc58a6000cf40aa4`
- Sequence 1 (4-step): `6a3c0500335ed40010812f0e`
- Sequence 2 (3-step): `6a3c1221410c06000c5560b8`
- Schedule "Normal Business Hours": `69ef9b97f6d770000d7ce098`

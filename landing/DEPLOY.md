# Cloudflare Pages — getdossier.co

Deploy the static landing (single HTML file).

## Option A — Git connect (recommended)

1. Push this repo to GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git.
3. **Build settings**
   - Framework preset: None
   - Build command: *(leave empty)*
   - Build output directory: `landing`
4. Custom domains → add `getdossier.co` and `www.getdossier.co`.
5. DNS at Cloudflare: apex `A`/`AAAA` or CNAME to Pages (wizard handles this).

## Option B — Wrangler CLI

```bash
npm i -g wrangler
wrangler pages deploy landing --project-name=getdossier
```

## Before go-live

- Default Cal.com link: `preframe/30min` (no env vars required).
- Optional separate Zoom/Teams events:
  - `VITE_CAL_ZOOM_LINK` — e.g. `preframe/zoom-30`
  - `VITE_CAL_TEAMS_LINK` — e.g. `preframe/teams-30`
- In Cal.com, enable Zoom + Teams as locations on the event so clients can pick during booking.
- Optional: run `npx tsx scripts/export-landing-openers.ts` in RunDossier to paste real anonymized openers from your DB.

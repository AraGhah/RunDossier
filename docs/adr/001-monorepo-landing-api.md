# ADR-001: Monorepo landing + API

## Status
Accepted

## Context
Dossier needs a public marketing site and a backend that processes prospect lists. Teams are small; deployment targets differ (Cloudflare Pages vs Docker on Hetzner).

## Decision
Single repository with `landing/` (static SPA) and `RunDossier/` (Express API + pg-boss workers). Shared branding and legal copy; API URL configured via `VITE_API_URL`.

## Consequences
- Independent deploys per folder
- No shared TypeScript package yet — duplicate constants acceptable for MVP
- CI runs both packages in matrix jobs

# Disaster recovery & availability

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | 24 hours | Supabase daily backups (verify plan tier) |
| **RTO** (Recovery Time Objective) | 4 hours | Redeploy API container + restore DB if needed |

## Components

| Component | Primary | Failure mode | Recovery |
|-----------|---------|--------------|----------|
| Landing | Cloudflare Pages | CDN outage (rare) | Wait or deploy to alternate Pages project |
| API | Hetzner Docker | Host crash | `docker compose up -d` on new VM; restore env secrets |
| Database | Supabase Postgres | Region outage | Restore from Supabase backup to new project; update `DATABASE_URL` |
| Secrets | `.env` / host env | Leak | Rotate JWT secret, API keys, redeploy |

## Runbook: API down

1. Check `GET /health` and Hetzner host status
2. `docker logs` on API container — OOM, DB connection, missing env
3. Verify Supabase connectivity and SSL (`DATABASE_SSL`)
4. Redeploy image from last known good commit
5. Notify via Telegram if configured

## Runbook: database restore

1. Open Supabase dashboard → Backups → restore to new instance
2. Update `DATABASE_URL` in production env
3. Run pending SQL migrations in `RunDossier/sql/migrations/`
4. Restart API; confirm pg-boss queues recreate
5. Run `npm run verify` from RunDossier

## Runbook: secret compromise

1. Rotate `JWT_SECRET`, `JWT_API_KEY`, `DOGFOOD_API_TOKEN`, third-party API keys
2. Redeploy API and landing env vars
3. Review `audit_events` for suspicious admin actions
4. Document incident in internal log

## Chaos / resilience (manual)

Quarterly exercises:

- Kill API container during job run → verify pg-boss retries
- Block Anthropic API key → verify circuit breaker / job failure paths
- Simulate DB connection drop → verify graceful shutdown on SIGTERM

## TLS / certificates

- **Landing**: Cloudflare manages edge TLS; HSTS in `landing/public/_headers`
- **API**: Terminate TLS at reverse proxy or Cloudflare tunnel; enable `TRUST_PROXY=1`
- **Postgres**: `DATABASE_SSL=true`; rotate Supabase certs per provider notice

## Contacts

- Operator: Ara Ghahramanyan — ara@getdossier.co
- Infrastructure: Hetzner + Supabase dashboards

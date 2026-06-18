# Platform engineering checklist

Audit matrix for the Dossier (Preframe) monorepo. Status: **Done** | **Partial** | **Planned** | **N/A**

| Capability | Status | Evidence |
|------------|--------|----------|
| Input sanitization & injection prevention | Partial | `RunDossier/src/utils/sanitize.ts`, parameterized SQL in `db.ts`, intake validation |
| Authentication, authorization, roles | Partial | JWT roles `admin`/`pilot` in `middleware/auth.ts`, `utils/jwt.ts` |
| Session management & token expiry | Partial | `JWT_EXPIRES_IN`, `JWT_PILOT_EXPIRES_IN` in `config.ts` |
| Secrets management | Partial | `.env.example`, `validateConfig()`, Docker `env_file` — use vault in prod |
| HTTPS, TLS, certificate rotation | Partial | HSTS (`security-headers.ts`, `landing/public/_headers`), Postgres SSL (`pg-ssl.ts`); certs via Cloudflare/Hetzner |
| Rate limiting & abuse prevention | Partial | `middleware/rate-limit.ts`, honeypot on pilot form |
| Dependency scanning & patching | Done | `.github/workflows/ci.yml` (`npm audit`), `.github/dependabot.yml` |
| Multi-tenancy & data isolation | Partial | `client_id` on prospects (`sql/migrations/004_*`); RLS planned |
| PII handling, retention, deletion | Partial | Privacy policy (`landing/src/i18n/privacy-data.js`), `jobs/pii-retention.job.ts` |
| Regulatory compliance (GDPR, HIPAA) | Partial | PIPEDA / Loi 25 / GDPR mentions in privacy & terms; **HIPAA N/A** (no PHI) |
| Audit trails & tamper-evident logging | Partial | `audit_events` + hash chain (`sql/migrations/010_*`, `utils/audit-log.ts`) |
| Unit tests | Done | `src/**/*.test.ts` |
| Integration tests | Done | `src/app.integration.test.ts` |
| E2E tests | Planned | Playwright smoke tests — see `docs/operations/testing.md` |
| Regression tests | Partial | CI runs full test suite on every PR |
| Load / stress testing | Planned | `docs/operations/load-tests/smoke.k6.js` template |
| Chaos / resilience testing | Planned | Runbook in `docs/operations/disaster-recovery.md` |
| Coverage thresholds in CI | Partial | `npm run test:coverage` in CI; raise threshold as suite grows |
| Code review process | Done | `CONTRIBUTING.md`, PR template |
| Error handling & graceful degradation | Partial | `middleware/error-handler.ts`, delivery digest fallback |
| Retry, backoff, idempotency | Partial | `utils/retry.ts`, pg-boss retries, `utils/idempotency.ts` |
| Circuit breakers & fallbacks | Partial | `utils/circuit-breaker.ts` |
| Concurrency & race conditions | Partial | pg-boss `localConcurrency: 1`, job singleton keys |
| Caching strategy | Partial | `utils/cache.ts` (TTL); CDN for landing |
| RTO & RPO | Done | `docs/operations/disaster-recovery.md` |
| Disaster recovery plan | Done | `docs/operations/disaster-recovery.md` |
| Accessibility | Partial | Skip link, focus trap, reduced motion; audit with Lighthouse |
| Architecture diagrams & ADRs | Done | `docs/architecture/`, `docs/adr/` |

## Next hardening (recommended)

1. Redis-backed rate limiting for multi-instance API
2. Supabase Row Level Security per `client_id`
3. Playwright E2E in CI for landing + pilot flow
4. External log sink (Datadog / Axiom) with 90-day retention
5. Secrets in Cloudflare/Hetzner secret store, not flat `.env`

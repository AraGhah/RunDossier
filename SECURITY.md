# Security policy

Aligned with **ITSAP.60.005** (July 2025) — [CCCS website security guidance](https://www.cyber.gc.ca/en/guidance/security-considerations-when-developing-and-managing-your-website-itsap60005).

Full control mapping: [`docs/security/ITSAP-60-005.md`](docs/security/ITSAP-60-005.md)

## Supported versions

| Component | Supported |
|-----------|-----------|
| `RunDossier` API on `main` | Yes |
| `landing` on `main` | Yes |

## Reporting a vulnerability

**Preferred:** use our [security.txt](https://getdossier.co/.well-known/security.txt)

Email **ara@getdossier.co** with:

- Description and impact
- Steps to reproduce
- Affected URLs or endpoints

We aim to acknowledge within 2 business days.

Do not open public GitHub issues for security reports.

## Practices in this repo

| Control | Implementation |
|---------|----------------|
| **HTTPS / TLS** | HSTS on API + landing; TLS at edge; encrypted Postgres (`DATABASE_SSL`) |
| **Authentication** | JWT + API key; timing-safe compare; lockout after 5 failed attempts |
| **Access control** | JWT roles (`admin`, `pilot`); least privilege per route |
| **Input validation** | Sanitization, length limits, markup rejection, parameterized SQL |
| **Injection / XSS** | No raw SQL; CSP headers; generic 500 responses (no DB leaks) |
| **CSRF** | Bearer JWT (not cookie sessions); CORS allowlist |
| **Rate limiting** | Per-route limits on auth, pilot, intake, admin APIs |
| **Session management** | Stateless JWT with TTL; `Cache-Control: no-store` |
| **Security headers** | CSP, X-Frame-Options, COOP, CORP, Referrer-Policy |
| **Audit logging** | Hash-chained `audit_events` for auth and intake |
| **Patch management** | Dependabot + CI `npm audit` |
| **PII retention** | Scheduled retention job per privacy policy |

## Environment

Never commit `.env` files. See `RunDossier/.env.example` for required secrets.

Production checklist:

- Set `TRUST_PROXY=true` behind HTTPS reverse proxy
- Set `CORS_ORIGINS` to your landing origin(s)
- Use strong `JWT_SECRET` (≥32 chars) and `JWT_API_KEY` (≥16 chars)
- Configure `TELEGRAM_WEBHOOK_SECRET` when using Telegram webhooks

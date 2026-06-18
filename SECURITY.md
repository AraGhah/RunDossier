# Security policy

## Supported versions

| Component | Supported |
|-----------|-----------|
| `RunDossier` API on `main` | Yes |
| `landing` on `main` | Yes |

## Reporting a vulnerability

Email **ara@getdossier.co** with:

- Description and impact
- Steps to reproduce
- Affected URLs or endpoints

We aim to acknowledge within 2 business days.

## Practices in this repo

- JWT authentication with role separation
- Rate limiting on public endpoints
- Security headers (CSP, HSTS on landing)
- Dependency scanning in CI (`npm audit`)
- No secrets in git — see `.env.example` files
- PII retention job aligned with published privacy policy

Do not open public GitHub issues for security reports.

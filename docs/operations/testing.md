# Testing strategy

## Automated (CI)

| Layer | Command | Location |
|-------|---------|----------|
| Unit | `npm test` | `RunDossier/src/**/*.test.ts` |
| Integration | included in `npm test` | `app.integration.test.ts` |
| Coverage | `npm run test:coverage` | utils + middleware |
| Landing build | `npm run build` | `landing/` |
| Dependency audit | `npm run audit:deps` | both packages |

## Regression

Every PR to `main` runs the full CI workflow (`.github/workflows/ci.yml`). Treat failing tests as release blockers.

## E2E (planned)

Recommended Playwright smoke tests:

1. Home loads, H1 visible
2. `/free-lines` form validation
3. `/contact` shows LinkedIn + email

Add `landing/e2e/` and a `e2e` job in CI when introduced.

## Load / stress

Template: `docs/operations/load-tests/smoke.k6.js`

Run locally:

```bash
k6 run docs/operations/load-tests/smoke.k6.js
```

Target: `/health` p95 < 200ms at 50 VUs for 1 minute.

## Chaos

See disaster recovery runbook — manual fault injection quarterly, not in CI.

## Accessibility

- Manual: keyboard nav, skip link, reduced motion
- Automated: add Lighthouse CI on landing (score ≥ 90)

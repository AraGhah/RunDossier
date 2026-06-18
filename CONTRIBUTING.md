# Contributing

## Workflow

1. Branch from `main`
2. Make focused changes; match existing code style
3. Run tests locally:
   - `cd RunDossier && npm test && npm run build`
   - `cd landing && npm run build`
4. Open a PR — CI must pass
5. At least one review before merge (owner or delegate)

## Code standards

- TypeScript strict mode in `RunDossier/`
- Parameterized SQL only — no string concatenation for queries
- User input through `utils/sanitize.ts` or validated intake helpers
- Secrets never committed — use `.env` locally, host secrets in production
- Structured logs via `utils/logger.ts` for new server code

## Security

Report vulnerabilities to ara@getdossier.co — see [SECURITY.md](../SECURITY.md).

## Documentation

- Architecture changes → update `docs/architecture/README.md`
- Significant decisions → add ADR in `docs/adr/`
- Platform checklist → update `docs/engineering/PLATFORM_CHECKLIST.md`

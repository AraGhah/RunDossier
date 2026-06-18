# ADR-002: Stateless JWT authentication

## Status
Accepted

## Context
Pilot form and admin intake need authentication without operating a session store.

## Decision
Issue HS256 JWTs via `jose` with roles `pilot` (15m, audience `pilot`) and `admin` (24h). Pilot token endpoint is origin-restricted. Admin token requires `JWT_API_KEY`.

## Consequences
- No server-side session revocation without key rotation
- Tokens must stay short-lived for public pilot role
- Legacy `DOGFOOD_API_TOKEN` supported for admin migration

# ADR-003: PII retention automation

## Status
Accepted

## Context
Privacy policy (`landing/src/i18n/privacy-data.js`) states retention limits. Manual deletion does not scale.

## Decision
Daily `pii-retention` pg-boss job:
- Delete `pilot_requests` older than 12 months
- Delete terminal-state `prospects` older than 90 days

Audit each run in `audit_events`.

## Consequences
- Migration `010_audit_events.sql` must be applied before audit logging works
- Deletion is hard-delete; backups follow Supabase RPO
- DSAR manual requests still handled via `ara@getdossier.co`

# Compliance scope

Dossier is a B2B cold-email research service. This document maps regulatory frameworks to our implementation.

## In scope

| Framework | Applicability | Implementation |
|-----------|---------------|----------------|
| **PIPEDA** (Canada) | Operator in Quebec | Privacy policy, retention job, contact for DSAR |
| **Quebec Law 25** | Quebec residents | Privacy policy sections, breach notification process (manual) |
| **GDPR** | EU prospects in client lists | Clients are controllers; we are processor — Terms + Privacy |
| **CASL / CAN-SPAM** | Outbound email context | Terms place campaign compliance on client; we do not send mail |

## Out of scope

| Framework | Reason |
|-----------|--------|
| **HIPAA** | No protected health information processed |

## Data subject rights

Requests to access, correct, or delete data: **ara@getdossier.co** — 30-day response per privacy policy.

## Retention

Automated: `RunDossier/src/jobs/pii-retention.job.ts`  
Documented: `landing/src/i18n/privacy-data.js`

## Audit

Security-relevant actions logged to `audit_events` (hash chain) when migration `010_audit_events.sql` is applied.

# Preframe — Warm Pilot Outreach Kit

Everything needed to run the "DM 10 warm-ish contacts a free pilot offer" step to a
production standard: ready-to-send copy, a funnel tracker, and a tested, idempotent
sync into your live `pilot_requests` table.

## Contents
```
README.md
playbook/Preframe_Warm_Pilot_Playbook.md     # the SOP: source → send → track → case study
messaging/Preframe_Pilot_DM_Templates.md      # offer + master + 10 persona variants + follow-ups
Preframe_Pilot_Funnel_Tracker.xlsx            # Funnel + live Dashboard + Sourcing + Message Bank + Readme
data/pilot_contacts_template.csv              # optional CSV input for the loader
loader/load_pilot_contacts.py                 # idempotent CSV/XLSX -> pilot_requests sync (RPC upsert)
loader/tests/test_load_pilot_contacts.py      # 28 unit tests (all passing)
loader/requirements.txt, loader/.env.example
db/migrations/20260622_01_pilot_requests_outbound_tracking.sql   # APPLIED to prod
db/migrations/20260622_02_pilot_requests_upsert_rpc.sql          # APPLIED to prod
db/security/rls_advisory_fix.sql              # OPTIONAL — review before running
types/pilot_requests.types.ts                 # TS types for the extended table
```

## Quick start
1. Read `playbook/Preframe_Warm_Pilot_Playbook.md`.
2. Fill the **Sourcing** tab in the tracker → pick your 10.
3. Personalize variants from the message pack → send (LinkedIn first).
4. Log each send in the **Funnel** tab; watch the **Dashboard** update.
5. Sync to Supabase: `cd loader && python load_pilot_contacts.py --file ../Preframe_Pilot_Funnel_Tracker.xlsx --dry-run` then drop `--dry-run`.

## What changed in the database (already applied)
- `pilot_requests`: +16 nullable tracking columns, 4 CHECK constraints, a unique
  `lower(email)` index, and an `updated_at` trigger. Non-breaking.
- New `upsert_pilot_contact(jsonb)` RPC (service-role only) for idempotent upserts.
- Verified live: insert + case-insensitive idempotency + COALESCE-preserve + trigger,
  then test rows removed. Pre-existing data untouched.

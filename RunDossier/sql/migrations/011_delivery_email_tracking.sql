-- W5 delivery email tracking + concurrency-safe delivery claim.
-- Idempotent and additive; safe to re-run. Apply after 004_workflow_w2_w5.sql (needs clients).
--
-- Why: the W5 client-delivery email had no durable record and no claim guard, so
-- overlapping triggers (per-prospect QA pass + the hourly delivery sweep) could
-- email the same batch twice, and a failed send left no auditable trace.
--
-- NOTE: some environments already have a different/stub `deliveries` table
-- (destination_type/destination_ref/delivered_at). This migration is written to
-- UPGRADE such a table in place (ADD COLUMN IF NOT EXISTS) rather than skip it.

-- 1) Transient claim status. A prospect being packaged into an in-flight delivery
--    is moved to 'delivering' so only one run can own a given batch at a time.
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check CHECK (status IN (
  'queued',
  'research_in_progress',
  'research_complete',
  'thin_research',
  'research_failed',
  'personalization_in_progress',
  'personalized_qa_passed',
  'qa_failed',
  'personalization_failed',
  'delivering',
  'delivered'
));

-- 2) Delivery ledger: one durable row per client delivery attempt + email outcome.
CREATE TABLE IF NOT EXISTS deliveries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns the delivery job writes exist (upgrades a pre-existing table).
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS client_id           UUID,
  ADD COLUMN IF NOT EXISTS status              TEXT        NOT NULL DEFAULT 'delivery_ready',
  ADD COLUMN IF NOT EXISTS recipient_email     TEXT,
  ADD COLUMN IF NOT EXISTS prospect_count      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_fit_score       INTEGER,
  ADD COLUMN IF NOT EXISTS filename            TEXT,
  ADD COLUMN IF NOT EXISTS file_path           TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS error               TEXT,
  ADD COLUMN IF NOT EXISTS attempts            INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prospect_ids        UUID[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS emailed_at          TIMESTAMPTZ;

ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (status IN (
  'delivery_ready',
  'email_sent',
  'email_failed',
  'skipped_no_recipient',
  'skipped_internal_only',
  'skipped_not_configured'
));

CREATE INDEX IF NOT EXISTS idx_deliveries_client_status ON deliveries(client_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created       ON deliveries(created_at);

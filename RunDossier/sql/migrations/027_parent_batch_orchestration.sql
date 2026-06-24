-- Parent batch orchestration: one requested job (e.g. 1000 prospects) across internal chunks.

CREATE TABLE IF NOT EXISTS parent_batches (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  requested_prospect_count  INTEGER     NOT NULL CHECK (requested_prospect_count > 0),
  status                    TEXT        NOT NULL DEFAULT 'processing'
                                        CHECK (status IN (
                                          'queued',
                                          'processing',
                                          'delivering',
                                          'completed',
                                          'partial',
                                          'failed',
                                          'stalled'
                                        )),
  imported_count            INTEGER     NOT NULL DEFAULT 0,
  delivered_count           INTEGER     NOT NULL DEFAULT 0,
  excluded_thin_research    INTEGER     NOT NULL DEFAULT 0,
  failed_count              INTEGER     NOT NULL DEFAULT 0,
  current_chunk             INTEGER     NOT NULL DEFAULT 0,
  replacement_used          BOOLEAN     NOT NULL DEFAULT false,
  source_exhausted          BOOLEAN     NOT NULL DEFAULT false,
  delivery_id               UUID        REFERENCES deliveries(id) ON DELETE SET NULL,
  stall_alerted_at          TIMESTAMPTZ,
  error_message             TEXT,
  metadata                  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parent_batches_client_status
  ON parent_batches(client_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_batches_active
  ON parent_batches(status, updated_at)
  WHERE status IN ('queued', 'processing', 'delivering');

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS parent_batch_id UUID REFERENCES parent_batches(id) ON DELETE SET NULL;

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS parent_batch_id UUID REFERENCES parent_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_parent_batch_status
  ON prospects(parent_batch_id, status)
  WHERE parent_batch_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS batch_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_batch_id UUID        REFERENCES parent_batches(id) ON DELETE CASCADE,
  prospect_id     UUID        REFERENCES prospects(id) ON DELETE SET NULL,
  event_type      TEXT        NOT NULL,
  from_status     TEXT,
  to_status       TEXT,
  message         TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_events_parent
  ON batch_events(parent_batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_events_prospect
  ON batch_events(prospect_id, created_at DESC);

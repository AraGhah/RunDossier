-- Delivery audit trail. One row per lifecycle event so client delivery issues
-- can be debugged end-to-end (created -> ready -> emailed/failed/skipped/retried).
-- Idempotent; safe to re-run. Apply after 011_delivery_email_tracking.sql.

CREATE TABLE IF NOT EXISTS delivery_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID        REFERENCES deliveries(id) ON DELETE CASCADE,
  client_id   UUID        REFERENCES clients(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL CHECK (event_type IN (
                            'created', 'ready', 'emailed', 'failed', 'retried', 'skipped'
                          )),
  status      TEXT,
  metadata    JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery ON delivery_events(delivery_id, created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_events_client   ON delivery_events(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_events_type     ON delivery_events(event_type, created_at);

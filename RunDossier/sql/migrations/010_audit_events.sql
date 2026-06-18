-- Tamper-evident audit trail (append-only; no UPDATE/DELETE in application code)

CREATE TABLE IF NOT EXISTS audit_events (
  id            BIGSERIAL PRIMARY KEY,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id    TEXT,
  actor_role    TEXT,
  actor_sub     TEXT,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  ip            TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  prev_hash     TEXT NOT NULL DEFAULT 'GENESIS',
  row_hash      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_occurred ON audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);

COMMENT ON TABLE audit_events IS 'Append-only audit log with SHA-256 hash chain for tamper detection';

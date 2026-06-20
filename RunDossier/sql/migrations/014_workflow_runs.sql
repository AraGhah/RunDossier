-- Workflow run tracking (Telegram /run, audit trail)

CREATE TABLE IF NOT EXISTS workflow_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source  TEXT        NOT NULL DEFAULT 'telegram',
  trigger_ref     TEXT,
  status          TEXT        NOT NULL DEFAULT 'running'
                              CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  stage           TEXT        NOT NULL DEFAULT 'queued',
  prospects_found INTEGER     NOT NULL DEFAULT 0,
  prospects_ingested INTEGER  NOT NULL DEFAULT 0,
  prospects_skipped INTEGER   NOT NULL DEFAULT 0,
  prospects_delivered INTEGER NOT NULL DEFAULT 0,
  prospects_thin_research INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_started ON workflow_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status) WHERE status = 'running';

COMMENT ON TABLE workflow_runs IS 'End-to-end workflow runs triggered via Telegram or API';

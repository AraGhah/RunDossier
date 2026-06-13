-- Workflow 10: Self-selling dogfood pipeline
-- Run once against Supabase Postgres after schema.sql

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS icp_fit_score INTEGER CHECK (icp_fit_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS smartlead_status TEXT NOT NULL DEFAULT 'none'
    CHECK (smartlead_status IN ('none', 'eligible', 'queued', 'pushed', 'skipped'));

CREATE INDEX IF NOT EXISTS idx_prospects_source ON prospects(source);
CREATE INDEX IF NOT EXISTS idx_prospects_smartlead_status ON prospects(smartlead_status);

CREATE TABLE IF NOT EXISTS dogfood_funnel_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID        NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  stage        TEXT        NOT NULL CHECK (stage IN (
    'prospect', 'researched', 'personalized', 'queued', 'open', 'reply', 'demo', 'closed'
  )),
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dogfood_funnel_prospect ON dogfood_funnel_events(prospect_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dogfood_funnel_stage ON dogfood_funnel_events(stage, created_at);

CREATE TABLE IF NOT EXISTS smartlead_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id     UUID        NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  variant_number  INTEGER     NOT NULL DEFAULT 1,
  subject         TEXT        NOT NULL,
  opener          TEXT        NOT NULL,
  bridge          TEXT,
  icp_fit_score   INTEGER,
  confidence_score INTEGER,
  composite_score NUMERIC(6, 2),
  status          TEXT        NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'pushed', 'failed', 'skipped')),
  pushed_at       TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prospect_id, variant_number)
);

CREATE INDEX IF NOT EXISTS idx_smartlead_queue_status ON smartlead_queue(status, created_at);

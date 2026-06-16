-- Run once against your Supabase Postgres (app tables only; pg-boss creates its own schema).
-- For existing databases, see sql/migrations/001_constraints_and_triggers.sql instead.

CREATE TABLE IF NOT EXISTS prospects (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  title            TEXT,
  company          TEXT,
  linkedin_url     TEXT        NOT NULL,
  research_summary TEXT,
  top_3_signals    JSONB,
  confidence_score INTEGER     CHECK (confidence_score BETWEEN 0 AND 100),
  status           TEXT        NOT NULL DEFAULT 'queued'
                               CHECK (status IN (
                                 'queued',
                                 'research_in_progress',
                                 'research_complete',
                                 'thin_research',
                                 'research_failed',
                                 'personalization_in_progress',
                                 'personalized_qa_passed',
                                 'qa_failed',
                                 'personalization_failed'
                               )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prospect_signals_raw (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID        NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  source       TEXT        NOT NULL CHECK (source IN ('linkedin', 'podcast')),
  raw_payload  JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name  TEXT        NOT NULL,
  version     INTEGER     NOT NULL DEFAULT 1,
  prompt_text TEXT        NOT NULL,
  active_bool BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS first_lines (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id       UUID        NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  variant_number    INTEGER     NOT NULL,
  subject           TEXT        NOT NULL,
  opener            TEXT        NOT NULL,
  bridge            TEXT        NOT NULL,
  angle             TEXT        NOT NULL,
  qa_score          NUMERIC,
  specificity_score NUMERIC,
  human_ness_score  NUMERIC,
  relevance_score   NUMERIC,
  length_ok         BOOLEAN,
  qa_verdict        TEXT        CHECK (qa_verdict IN ('ship', 'reject')),
  qa_reason         TEXT,
  model_used        TEXT,
  prompt_version_id UUID        REFERENCES prompt_versions(id),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'ready', 'rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prospect_id, variant_number)
);

CREATE TABLE IF NOT EXISTS ai_costs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    TEXT        NOT NULL,
  prospect_id   UUID,
  model         TEXT        NOT NULL,
  input_tokens  INTEGER     NOT NULL DEFAULT 0,
  output_tokens INTEGER     NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(12, 6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow    TEXT        NOT NULL,
  entity_id   UUID        NOT NULL,
  error       TEXT        NOT NULL,
  retry_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prospects_status         ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_first_lines_prospect     ON first_lines(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_agent    ON prompt_versions(agent_name, active_bool);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_workflow     ON failed_jobs(workflow, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_costs_prospect        ON ai_costs(prospect_id);

-- Optional: auto-update trigger is in sql/triggers.sql (requires prospects.updated_at column).

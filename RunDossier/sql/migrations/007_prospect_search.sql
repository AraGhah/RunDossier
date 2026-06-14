-- W1 Prospect Search: discover prospects per client via Sales Navigator + optional LinkedIn enrich

CREATE TABLE IF NOT EXISTS client_search_profiles (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  search_url           TEXT        NOT NULL,
  title_keywords       TEXT[]      NOT NULL DEFAULT '{}',
  min_employees        INTEGER,
  max_employees        INTEGER,
  min_icp_score        INTEGER     CHECK (min_icp_score IS NULL OR min_icp_score BETWEEN 0 AND 100),
  max_results_per_run  INTEGER     NOT NULL DEFAULT 50 CHECK (max_results_per_run BETWEEN 1 AND 200),
  enrich_profiles      BOOLEAN     NOT NULL DEFAULT true,
  enabled              BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_profiles_client ON client_search_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_search_profiles_enabled ON client_search_profiles(enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS search_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES client_search_profiles(id) ON DELETE CASCADE,
  client_id       UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'completed', 'failed')),
  leads_found     INTEGER     NOT NULL DEFAULT 0,
  leads_ingested  INTEGER     NOT NULL DEFAULT 0,
  leads_skipped   INTEGER     NOT NULL DEFAULT 0,
  leads_enriched  INTEGER     NOT NULL DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_search_runs_client ON search_runs(client_id, started_at DESC);

ALTER TABLE prospect_signals_raw DROP CONSTRAINT IF EXISTS prospect_signals_raw_source_check;
ALTER TABLE prospect_signals_raw ADD CONSTRAINT prospect_signals_raw_source_check
  CHECK (source IN ('linkedin', 'podcast', 'sales_navigator'));

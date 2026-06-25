-- ICP Campaign Builder: campaigns + audit log + FK linkage to prospects/batches

CREATE TABLE IF NOT EXISTS campaigns (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                     TEXT        NOT NULL CHECK (trim(name) <> ''),
  status                   TEXT        NOT NULL DEFAULT 'draft'
                                       CHECK (status IN (
                                         'draft','queued','running','paused',
                                         'cancelling','cancelled',
                                         'completed','completed_with_issues','failed'
                                       )),
  target_count             INTEGER     NOT NULL DEFAULT 100 CHECK (target_count > 0),
  -- All ICP fields stored verbatim as entered by operator
  icp_config               JSONB       NOT NULL DEFAULT '{}',
  criteria                 JSONB       NOT NULL DEFAULT '[]',
  locations                JSONB       NOT NULL DEFAULT '[]',
  -- Pipeline counters (refreshed by service)
  accepted_count           INTEGER     NOT NULL DEFAULT 0,
  rejected_count           INTEGER     NOT NULL DEFAULT 0,
  pending_count            INTEGER     NOT NULL DEFAULT 0,
  research_complete_count  INTEGER     NOT NULL DEFAULT 0,
  personalized_count       INTEGER     NOT NULL DEFAULT 0,
  qa_passed_count          INTEGER     NOT NULL DEFAULT 0,
  delivered_count          INTEGER     NOT NULL DEFAULT 0,
  failed_count             INTEGER     NOT NULL DEFAULT 0,
  -- Lifecycle timestamps
  started_at               TIMESTAMPTZ,
  paused_at                TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  -- Cancellation metadata
  cancelled_by             TEXT,
  cancellation_reason      TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client_status ON campaigns(client_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_active
  ON campaigns(status, updated_at DESC)
  WHERE status IN ('queued','running','paused','cancelling');

-- Every status transition is logged here
CREATE TABLE IF NOT EXISTS campaign_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL,
  from_status  TEXT,
  to_status    TEXT,
  actor        TEXT,
  reason       TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign
  ON campaign_events(campaign_id, created_at DESC);

-- Link prospects and batches to their campaign
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_campaign_id
  ON prospects(campaign_id) WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_batches_campaign_id
  ON batches(campaign_id) WHERE campaign_id IS NOT NULL;

-- Workflow 1: client onboarding (Stripe subscription -> Tally form -> ICP parse -> approval -> first batch).
-- Idempotent and additive; safe to re-run.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status                 TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS api_key_hash           TEXT,
  ADD COLUMN IF NOT EXISTS api_key_prefix         TEXT,
  ADD COLUMN IF NOT EXISTS icp_brief              TEXT,
  ADD COLUMN IF NOT EXISTS icp_parsed             JSONB,
  ADD COLUMN IF NOT EXISTS onboarding_token       TEXT,
  ADD COLUMN IF NOT EXISTS approval_token         TEXT,
  ADD COLUMN IF NOT EXISTS form_sent_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS form_submitted_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS icp_approved_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_at              TIMESTAMPTZ;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check CHECK (status IN (
  'onboarding', 'pending_approval', 'active', 'paused', 'churned'
));

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_stripe_sub
  ON clients(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_token
  ON clients(onboarding_token) WHERE onboarding_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_approval_token
  ON clients(approval_token) WHERE approval_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS onboarding_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_client ON onboarding_events(client_id, created_at);

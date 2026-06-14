-- W2 intake → W3 research → W4 personalize → W4.5 QA → W5 CSV delivery

-- Clients (W5 email recipient lookup)
CREATE TABLE IF NOT EXISTS clients (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  contact_email     TEXT        NOT NULL,
  client_first_name TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batches (W2 groups of 50)
CREATE TABLE IF NOT EXISTS batches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prospect_count INTEGER     NOT NULL DEFAULT 0,
  status         TEXT        NOT NULL DEFAULT 'queued'
                             CHECK (status IN ('queued', 'processing', 'delivered')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prospects: client scope + email for CSV delivery
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buying_triggers JSONB,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Allow delivered status
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
  'delivered'
));

-- first_lines: W4 signal_used, W4.5 is_chosen + qa fields
ALTER TABLE first_lines
  ADD COLUMN IF NOT EXISTS signal_used TEXT,
  ADD COLUMN IF NOT EXISTS is_chosen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grounded BOOLEAN,
  ADD COLUMN IF NOT EXISTS qa_created_at TIMESTAMPTZ;

ALTER TABLE first_lines DROP CONSTRAINT IF EXISTS first_lines_status_check;
ALTER TABLE first_lines ADD CONSTRAINT first_lines_status_check CHECK (status IN (
  'pending', 'ready', 'rejected', 'qa_passed', 'qa_failed'
));

-- failed_jobs: optional entity for validation-only failures (W2)
ALTER TABLE failed_jobs ALTER COLUMN entity_id DROP NOT NULL;

-- Dedupe per client (W2)
CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_client_linkedin
  ON prospects (client_id, linkedin_url)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_client_status ON prospects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_client ON batches(client_id);
CREATE INDEX IF NOT EXISTS idx_first_lines_chosen ON first_lines(prospect_id) WHERE is_chosen = true;

-- Default internal client for CLI ingest without explicit client_id
INSERT INTO clients (id, name, contact_email, client_first_name)
VALUES (
  'cd435b0e-6767-499f-99cd-c42a14a18a35',
  'Dossier Internal',
  'ara@getdossier.co',
  'Ara'
)
ON CONFLICT (id) DO NOTHING;

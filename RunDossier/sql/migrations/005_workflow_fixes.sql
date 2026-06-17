-- Idempotent fixes after 004_workflow_w2_w5.sql

ALTER TABLE prospects ALTER COLUMN linkedin_url DROP NOT NULL;

-- Legacy DBs may lack title/company (required by W2 intake + W3 research UPDATE)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT;

-- failed_jobs: some legacy DBs lack created_at (do not stamp old rows as "now")
ALTER TABLE failed_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
UPDATE failed_jobs SET created_at = TIMESTAMPTZ '2000-01-01' WHERE created_at IS NULL;
ALTER TABLE failed_jobs ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE failed_jobs ALTER COLUMN created_at SET NOT NULL;
-- Ensure workflow columns exist (safe if 004 already ran)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buying_triggers JSONB,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE first_lines
  ADD COLUMN IF NOT EXISTS signal_used TEXT,
  ADD COLUMN IF NOT EXISTS is_chosen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grounded BOOLEAN,
  ADD COLUMN IF NOT EXISTS qa_created_at TIMESTAMPTZ;

ALTER TABLE failed_jobs ALTER COLUMN entity_id DROP NOT NULL;

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

ALTER TABLE first_lines DROP CONSTRAINT IF EXISTS first_lines_status_check;
ALTER TABLE first_lines ADD CONSTRAINT first_lines_status_check CHECK (status IN (
  'pending', 'ready', 'rejected', 'qa_passed', 'qa_failed'
));

-- Default client for legacy prospects + delivery
INSERT INTO clients (id, name, contact_email, client_first_name)
VALUES (
  'cd435b0e-6767-499f-99cd-c42a14a18a35',
  'Dossier Internal',
  'ara@getdossier.co',
  'Ara'
)
ON CONFLICT (id) DO NOTHING;

UPDATE prospects
SET client_id = 'cd435b0e-6767-499f-99cd-c42a14a18a35'
WHERE client_id IS NULL;

-- Backfill is_chosen: best shipped line per personalized_qa_passed prospect
WITH ranked AS (
  SELECT fl.id,
         ROW_NUMBER() OVER (
           PARTITION BY fl.prospect_id
           ORDER BY fl.is_chosen DESC NULLS LAST,
                    fl.qa_score DESC NULLS LAST,
                    fl.variant_number ASC
         ) AS rn
  FROM first_lines fl
  JOIN prospects p ON p.id = fl.prospect_id
  WHERE p.status = 'personalized_qa_passed'
    AND fl.status IN ('ready', 'qa_passed')
)
UPDATE first_lines fl
SET is_chosen = true
FROM ranked r
WHERE fl.id = r.id AND r.rn = 1 AND fl.is_chosen = false;

-- Deactivate legacy prompt name
UPDATE prompt_versions SET active_bool = false
WHERE agent_name = 'personalization_generator';

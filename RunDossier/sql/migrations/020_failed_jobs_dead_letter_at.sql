-- Step 38: dead-letter visibility. Add dead_letter_at to failed_jobs and auto-stamp
-- it on terminal dead-letter rows (workflow contains 'dead-letter'). Idempotent.
ALTER TABLE failed_jobs ADD COLUMN IF NOT EXISTS dead_letter_at TIMESTAMPTZ;

UPDATE failed_jobs SET dead_letter_at = created_at
WHERE dead_letter_at IS NULL AND workflow LIKE '%dead-letter%';

CREATE OR REPLACE FUNCTION set_failed_jobs_dead_letter_at() RETURNS trigger AS $$
BEGIN
  IF NEW.dead_letter_at IS NULL AND NEW.workflow LIKE '%dead-letter%' THEN
    NEW.dead_letter_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_failed_jobs_dead_letter_at ON failed_jobs;
CREATE TRIGGER trg_failed_jobs_dead_letter_at
  BEFORE INSERT ON failed_jobs
  FOR EACH ROW EXECUTE FUNCTION set_failed_jobs_dead_letter_at();

CREATE INDEX IF NOT EXISTS idx_failed_jobs_created ON failed_jobs(created_at);

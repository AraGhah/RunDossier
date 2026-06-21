-- Step 37 (Workflow 4 upgrade): terminal dead-letter status for prospects whose
-- personalization exhausted the model-escalation ladder or hit the cost cap.
-- The scheduler never selects 'dead_letter', so these stop looping. Idempotent.
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
  'delivering',
  'delivered',
  'dead_letter'
));

-- One-time: backdate legacy failed_jobs stamped at migration time or known resolved errors
UPDATE failed_jobs
SET created_at = TIMESTAMPTZ '2000-01-01'
WHERE created_at > NOW() - INTERVAL '30 days'
  AND (
    error ~ '(research_agent|apifyApi|Dataset ID|column "company"|column "updated_at"|Actor requires full access|Forbidden - perhaps check your credentials|invalid input syntax for type uuid|No LinkedIn profile returned)'
  );

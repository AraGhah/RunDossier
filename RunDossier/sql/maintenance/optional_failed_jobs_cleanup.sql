-- OPTIONAL maintenance — review before running. Not applied automatically.
-- The "duplicate linkedin_url" rows are EXPECTED dedup hits, not real failures.
-- Run only AFTER WF2/intake is changed to stop logging expected duplicates
-- (see docs/operations/pipeline-verification/n8n_fixes.md, H1).
DELETE FROM failed_jobs
WHERE workflow = 'W2 - Prospect Intake' AND error LIKE 'duplicate linkedin_url%';

-- Archive historical/seed research failures (placeholder-dated 2000-01-01):
DELETE FROM failed_jobs
WHERE workflow IN ('research','research_agent') AND created_at < '2026-01-01';

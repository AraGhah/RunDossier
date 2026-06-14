-- W3: Apollo enrichment alongside LinkedIn research signals

ALTER TABLE prospect_signals_raw DROP CONSTRAINT IF EXISTS prospect_signals_raw_source_check;
ALTER TABLE prospect_signals_raw ADD CONSTRAINT prospect_signals_raw_source_check
  CHECK (source IN ('linkedin', 'podcast', 'sales_navigator', 'apollo'));

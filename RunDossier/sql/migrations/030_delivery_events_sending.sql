-- Allow 'sending' audit events for in-flight email delivery.
ALTER TABLE delivery_events DROP CONSTRAINT IF EXISTS delivery_events_event_type_check;
ALTER TABLE delivery_events ADD CONSTRAINT delivery_events_event_type_check CHECK (event_type IN (
  'created', 'ready', 'sending', 'emailed', 'failed', 'retried', 'skipped'
));

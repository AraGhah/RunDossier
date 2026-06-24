-- Hardening: one active parent batch per client, delivery recovery metadata.

-- Resolve legacy duplicate active rows before unique index (keep newest per client).
UPDATE parent_batches pb
   SET status = 'failed',
       error_message = COALESCE(error_message, 'Superseded by newer active batch (migration 028)'),
       updated_at = NOW()
 WHERE status IN ('queued', 'processing', 'delivering')
   AND id NOT IN (
     SELECT DISTINCT ON (client_id) id
       FROM parent_batches
      WHERE status IN ('queued', 'processing', 'delivering')
      ORDER BY client_id, created_at DESC
   );

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_batches_one_active_per_client
  ON parent_batches (client_id)
  WHERE status IN ('queued', 'processing', 'delivering');

ALTER TABLE parent_batches
  ADD COLUMN IF NOT EXISTS source_miss_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_prospect_activity_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prospects_parent_batch_updated
  ON prospects(parent_batch_id, updated_at DESC)
  WHERE parent_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_batch_events_type_created
  ON batch_events(event_type, created_at DESC);

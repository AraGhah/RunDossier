-- Step 34: client ops dashboard metrics. Idempotent and additive.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tier               TEXT,
  ADD COLUMN IF NOT EXISTS mrr                NUMERIC,
  ADD COLUMN IF NOT EXISTS health_score       INTEGER,
  ADD COLUMN IF NOT EXISTS reply_rate         NUMERIC,
  ADD COLUMN IF NOT EXISTS next_delivery_date DATE;

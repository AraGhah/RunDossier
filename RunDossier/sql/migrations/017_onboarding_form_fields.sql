-- Step 33: self-hosted onboarding form fields. Idempotent and additive.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS offer               TEXT,
  ADD COLUMN IF NOT EXISTS brand_voice_samples JSONB,
  ADD COLUMN IF NOT EXISTS target_accounts     TEXT;

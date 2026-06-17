-- Legacy DBs may have trg_prospects_updated_at without prospects.updated_at (delivery UPDATE fails).

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE prospects
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE prospects ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE prospects ALTER COLUMN updated_at SET NOT NULL;

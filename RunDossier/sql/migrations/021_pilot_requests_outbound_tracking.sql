-- 021: Warm-pilot outbound tracking on pilot_requests (manual-DM pilot funnel).
-- Extends the 003 pilot_requests table so manual warm DMs can be tracked & synced.
-- Additive, non-breaking, idempotent. APPLIED to production 2026-06-22
-- (Supabase migration name: pilot_requests_outbound_tracking).

ALTER TABLE pilot_requests
  ADD COLUMN IF NOT EXISTS relationship     TEXT,
  ADD COLUMN IF NOT EXISTS persona          TEXT,
  ADD COLUMN IF NOT EXISTS channel          TEXT,
  ADD COLUMN IF NOT EXISTS warmth           SMALLINT,
  ADD COLUMN IF NOT EXISTS message_variant  TEXT,
  ADD COLUMN IF NOT EXISTS owner            TEXT,
  ADD COLUMN IF NOT EXISTS mutual           TEXT,
  ADD COLUMN IF NOT EXISTS contacted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_reply_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_sentiment  TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_1_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_2_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pilot_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome          TEXT,
  ADD COLUMN IF NOT EXISTS notes            TEXT,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- Guarded value constraints (allow NULL so existing rows stay valid).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pilot_requests_channel_chk') THEN
    ALTER TABLE pilot_requests ADD CONSTRAINT pilot_requests_channel_chk
      CHECK (channel IS NULL OR channel IN ('linkedin','email','both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pilot_requests_reply_sentiment_chk') THEN
    ALTER TABLE pilot_requests ADD CONSTRAINT pilot_requests_reply_sentiment_chk
      CHECK (reply_sentiment IS NULL OR reply_sentiment IN ('positive','neutral','negative','no_reply'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pilot_requests_warmth_chk') THEN
    ALTER TABLE pilot_requests ADD CONSTRAINT pilot_requests_warmth_chk
      CHECK (warmth IS NULL OR (warmth >= 1 AND warmth <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pilot_requests_outcome_chk') THEN
    ALTER TABLE pilot_requests ADD CONSTRAINT pilot_requests_outcome_chk
      CHECK (outcome IS NULL OR outcome IN (
        'pending','no_response','replied','call_booked','pilot_accepted',
        'pilot_delivered','case_study','referral','declined'));
  END IF;
END $$;

-- UNIQUE index on lower(email) enables idempotent ON CONFLICT upsert (used by 022).
-- Supersedes the non-unique idx_pilot_requests_email created in 003 (left in place; harmless).
CREATE UNIQUE INDEX IF NOT EXISTS pilot_requests_email_lower_uidx
  ON pilot_requests (lower(email));

CREATE OR REPLACE FUNCTION pilot_requests_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pilot_requests_updated_at ON pilot_requests;
CREATE TRIGGER trg_pilot_requests_updated_at
  BEFORE UPDATE ON pilot_requests
  FOR EACH ROW EXECUTE FUNCTION pilot_requests_set_updated_at();

COMMENT ON COLUMN pilot_requests.relationship IS 'friend_of_friend | warm_intro | community | second_degree | past_colleague';
COMMENT ON COLUMN pilot_requests.channel      IS 'linkedin | email | both';
COMMENT ON COLUMN pilot_requests.warmth       IS '1 (cool) .. 5 (close)';

-- Pilot intake form (landing page → API)

CREATE TABLE IF NOT EXISTS pilot_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  company      TEXT        NOT NULL,
  sequencer    TEXT,
  profile_url  TEXT,
  status       TEXT        NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'contacted', 'in_progress', 'delivered', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_requests_created ON pilot_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_requests_email ON pilot_requests(LOWER(email));

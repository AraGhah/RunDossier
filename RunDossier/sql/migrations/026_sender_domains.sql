-- 026: Sender-domain deliverability readiness model.
-- Idempotent and additive; safe to re-run. Server-only table (RLS enabled, owner
-- connection bypasses RLS) matching the pattern in migration 025.
--
-- Encodes the deliverability safety policy in DATA:
--   * the primary operating domain (getdossier.co) is seeded as blocked + paused
--   * new tables default a sender to is_sending_paused = true (safe by default)
-- Server-side enforcement lives in src/services/deliverability/*.

CREATE TABLE IF NOT EXISTS sender_domains (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain                   TEXT NOT NULL UNIQUE,
  is_primary_domain        BOOLEAN NOT NULL DEFAULT FALSE,
  is_cold_sending_domain   BOOLEAN NOT NULL DEFAULT FALSE,
  provider                 TEXT,
  spf_status               TEXT NOT NULL DEFAULT 'unknown',
  dkim_status              TEXT NOT NULL DEFAULT 'unknown',
  dmarc_status             TEXT NOT NULL DEFAULT 'unknown',
  dmarc_policy             TEXT NOT NULL DEFAULT 'unknown',
  mailbox_status           TEXT NOT NULL DEFAULT 'unknown',
  mailbox_created_at       TIMESTAMPTZ,
  warmup_status            TEXT NOT NULL DEFAULT 'not_started',
  warmup_started_at        TIMESTAMPTZ,
  sending_readiness        TEXT NOT NULL DEFAULT 'not_ready',
  daily_send_limit         INTEGER NOT NULL DEFAULT 0,
  current_daily_send_count INTEGER NOT NULL DEFAULT 0,
  bounce_rate              NUMERIC(5,2),
  spam_rate                NUMERIC(5,2),
  reply_rate               NUMERIC(5,2),
  blacklist_status         TEXT NOT NULL DEFAULT 'unknown',
  last_verified_at         TIMESTAMPTZ,
  last_error               TEXT,
  is_sending_paused        BOOLEAN NOT NULL DEFAULT TRUE,
  pause_reason             TEXT,
  -- admin-only escape hatch to permit the primary domain for scaled outreach (Part 3)
  primary_override         BOOLEAN NOT NULL DEFAULT FALSE,
  -- set true only after a limited test batch passes; gate for scaled_sending_ready (Part 6)
  limited_test_passed      BOOLEAN NOT NULL DEFAULT FALSE,
  -- explicit admin sign-off required to enter scaled_sending_ready (Part 6)
  scaled_approved          BOOLEAN NOT NULL DEFAULT FALSE,
  provider_warning         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_spf_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_spf_check
  CHECK (spf_status   IN ('unknown','pass','fail','missing'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_dkim_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_dkim_check
  CHECK (dkim_status  IN ('unknown','pass','fail','missing'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_dmarc_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_dmarc_check
  CHECK (dmarc_status IN ('unknown','pass','fail','missing'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_dmarc_policy_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_dmarc_policy_check
  CHECK (dmarc_policy IN ('none','quarantine','reject','unknown'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_mailbox_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_mailbox_check
  CHECK (mailbox_status IN ('unknown','connected','disconnected','invalid'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_warmup_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_warmup_check
  CHECK (warmup_status IN ('not_started','warming','complete','skipped'));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_readiness_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_readiness_check
  CHECK (sending_readiness IN (
    'not_ready','auth_incomplete','warming','limited_test_ready','scaled_sending_ready','paused','blocked'
  ));
ALTER TABLE sender_domains DROP CONSTRAINT IF EXISTS sender_domains_blacklist_check;
ALTER TABLE sender_domains ADD CONSTRAINT sender_domains_blacklist_check
  CHECK (blacklist_status IN ('unknown','clean','listed'));

CREATE INDEX IF NOT EXISTS idx_sender_domains_readiness ON sender_domains(sending_readiness);
CREATE INDEX IF NOT EXISTS idx_sender_domains_cold ON sender_domains(is_cold_sending_domain) WHERE is_cold_sending_domain;

-- Append-only state-change log for dashboard visibility + tamper-evident audit pairing.
CREATE TABLE IF NOT EXISTS sender_domain_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   UUID REFERENCES sender_domains(id) ON DELETE CASCADE,
  domain      TEXT NOT NULL,
  from_state  TEXT,
  to_state    TEXT,
  reason      TEXT,
  actor       TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sender_domain_events_domain
  ON sender_domain_events(domain_id, created_at DESC);

-- updated_at trigger (set_updated_at() is defined in the base schema).
DROP TRIGGER IF EXISTS trg_sender_domains_updated_at ON sender_domains;
CREATE TRIGGER trg_sender_domains_updated_at
  BEFORE UPDATE ON sender_domains
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Server-only: enable RLS with no policies (owner connection bypasses RLS), matching migration 025.
ALTER TABLE sender_domains       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sender_domain_events ENABLE ROW LEVEL SECURITY;

-- Seed the primary operating domain in the SAFE state: blocked + paused for cold outreach.
-- DKIM/DMARC are missing (verified 2026-06-24); SPF passes. Do not flip these by hand —
-- they are set by the verification pipeline against live DNS.
INSERT INTO sender_domains (
  domain, is_primary_domain, is_cold_sending_domain, provider,
  spf_status, dkim_status, dmarc_status, dmarc_policy,
  mailbox_status, mailbox_created_at, warmup_status,
  sending_readiness, daily_send_limit, blacklist_status,
  is_sending_paused, pause_reason, last_verified_at
) VALUES (
  'getdossier.co', TRUE, FALSE, 'google_workspace',
  'pass', 'missing', 'missing', 'unknown',
  'connected', '2026-06-14T00:00:00Z', 'not_started',
  'blocked', 0, 'unknown',
  TRUE, 'Primary operating domain — not for scaled cold outreach. Use a dedicated sending domain.', NOW()
)
ON CONFLICT (domain) DO NOTHING;

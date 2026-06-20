-- Telegram bot: idempotency for webhook updates + command audit trail

CREATE TABLE IF NOT EXISTS telegram_updates (
  update_id   BIGINT      PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_command_log (
  id          BIGSERIAL   PRIMARY KEY,
  update_id   BIGINT      NOT NULL,
  command     TEXT        NOT NULL,
  args        TEXT,
  chat_id     BIGINT      NOT NULL,
  result      TEXT        NOT NULL CHECK (result IN ('ok', 'error', 'denied')),
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_command_log_created ON telegram_command_log(created_at DESC);

COMMENT ON TABLE telegram_updates IS 'Processed Telegram update_id values — prevents duplicate job creation on webhook retry';
COMMENT ON TABLE telegram_command_log IS 'Audit trail for bot commands';

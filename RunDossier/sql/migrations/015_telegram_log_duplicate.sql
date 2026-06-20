-- Allow 'duplicate' result in telegram_command_log (idempotent webhook retries)

ALTER TABLE telegram_command_log DROP CONSTRAINT IF EXISTS telegram_command_log_result_check;
ALTER TABLE telegram_command_log ADD CONSTRAINT telegram_command_log_result_check
  CHECK (result IN ('ok', 'error', 'denied', 'duplicate'));

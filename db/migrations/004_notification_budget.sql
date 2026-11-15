-- Daily SMTP attempts for the transactional outbox, shared by all workers.
-- UTC dates match the existing SMTP_DAILY_LIMIT semantics in mail mode.
-- A reserved attempt remains counted after failure, interruption or restart.
-- Apply explicitly; never run schema migrations during application startup.
CREATE TABLE IF NOT EXISTS aura_notification_daily_budget (
  day_key DATE NOT NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

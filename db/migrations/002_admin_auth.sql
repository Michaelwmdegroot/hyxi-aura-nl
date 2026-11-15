-- HYXI AURA Beheer — migration 002 (manual; NEVER auto-applied at startup).
-- No users, passwords, secrets, or example records are inserted.
CREATE TABLE IF NOT EXISTS aura_admin_users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  login_email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  role VARCHAR(16) NOT NULL,
  mfa_secret_encrypted VARBINARY(255) NOT NULL,
  mfa_last_accepted_step BIGINT NOT NULL DEFAULT -1,
  disabled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_aura_admin_email (login_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_admin_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  KEY idx_aura_admin_session_user (user_id),
  KEY idx_aura_admin_session_expiry (expires_at),
  CONSTRAINT fk_aura_admin_session_user FOREIGN KEY (user_id)
    REFERENCES aura_admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_admin_login_guards (
  guard_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  failures SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME(3) NOT NULL,
  blocked_until DATETIME(3) NULL,
  PRIMARY KEY (guard_hash),
  KEY idx_aura_admin_guard_window (window_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_admin_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  lead_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  action VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  result_code VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ok',
  occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_aura_admin_audit_actor_time (actor_user_id, occurred_at),
  KEY idx_aura_admin_audit_lead_time (lead_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

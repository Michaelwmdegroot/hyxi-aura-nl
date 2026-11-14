-- HYXI AURA 2.0 — draft schema, not yet deployed.
-- Migration 001. Review with the actual Hostinger MySQL/MariaDB version,
-- create a backup/restore point and apply on isolated staging FIRST.
-- This is STRUCTURE only: no historical lead data are backfilled.
-- Schema is designed for ENCRYPTED lead payloads; the application-side
-- encryption, repository and transactional outbox will be a separate PR.
-- Do not run automatically on production startup.

CREATE TABLE IF NOT EXISTS aura_schema_migrations (
  version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_leads (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_id VARCHAR(48) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_type VARCHAR(16) NOT NULL DEFAULT 'advice',
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  source_domain VARCHAR(100) NOT NULL DEFAULT 'hyxi-aura.nl',
  -- Contains encrypted JSON (name/email/phone/postcode/profile/attribution).
  -- Never insert plaintext: implement AES-256-GCM + key rotation BEFORE use.
  encrypted_payload MEDIUMBLOB NOT NULL,
  encryption_key_id VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  privacy_version VARCHAR(32) NOT NULL,
  contact_requested_at DATETIME(3) NOT NULL,
  assigned_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_aura_leads_request_id (request_id),
  KEY idx_aura_leads_status_created (status, created_at),
  KEY idx_aura_leads_assignee_created (assigned_user_id, created_at),
  KEY idx_aura_leads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_submission_keys (
  -- An HMAC of the public Idempotency-Key; no raw browser token is stored.
  key_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- An HMAC of a normalized validated request, not raw PII.
  payload_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  lead_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (key_hash),
  KEY idx_aura_submission_expiry (expires_at),
  KEY idx_aura_submission_lead_id (lead_id),
  CONSTRAINT fk_aura_submission_lead
    FOREIGN KEY (lead_id) REFERENCES aura_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_lead_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event_type VARCHAR(48) NOT NULL,
  actor_type VARCHAR(16) NOT NULL DEFAULT 'system',
  actor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  -- Only allowlisted status codes/structured metadata, never contact data.
  metadata_json JSON NULL,
  occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_aura_lead_events_timeline (lead_id, occurred_at, id),
  CONSTRAINT fk_aura_events_lead
    FOREIGN KEY (lead_id) REFERENCES aura_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_notification_outbox (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  lead_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event_type VARCHAR(40) NOT NULL DEFAULT 'lead_received',
  delivery_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  claimed_until DATETIME(3) NULL,
  -- Stable mail identifier for investigating duplicate/ambiguous SMTP outcomes.
  mail_message_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  last_error_code VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  accepted_by_smtp_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_aura_notification_lead_type (lead_id, event_type),
  UNIQUE KEY uq_aura_notification_mail_id (mail_message_id),
  KEY idx_aura_notification_work (delivery_status, next_attempt_at),
  KEY idx_aura_notification_claim (claimed_until),
  CONSTRAINT fk_aura_notification_lead
    FOREIGN KEY (lead_id) REFERENCES aura_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentionally no INSERT into aura_schema_migrations.
-- A reviewed migration runner will record a SHA-256 checksum after verifying
-- every DDL statement and the target schema. MySQL DDL is not transactional.

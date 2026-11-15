-- HYXI AURA Beheer — migration 003 (manual; NEVER auto-applied at startup).
-- Terminal account operations have no web actor. Keep the affected account
-- separate from actor_user_id so a recovery never impersonates the user.
ALTER TABLE aura_admin_audit
  ADD COLUMN target_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER actor_user_id;

ALTER TABLE aura_admin_audit
  ADD KEY idx_aura_admin_audit_target_time (target_user_id, occurred_at);

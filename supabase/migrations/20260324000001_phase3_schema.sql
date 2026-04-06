-- Phase 3: Add FK constraint on decisions.resolved_option_id
ALTER TABLE decisions
  ADD CONSTRAINT decisions_resolved_option_id_fkey
  FOREIGN KEY (resolved_option_id)
  REFERENCES decision_options(id)
  ON DELETE SET NULL;

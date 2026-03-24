-- Phase 2 schema additions
-- 1. Add notes column to milestones
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS notes text;

-- 2. Add dismissed_welcome column to weddings
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dismissed_welcome boolean NOT NULL DEFAULT false;

-- 3. Seed trigger: fires after each new wedding insert to create 9 default milestones
CREATE OR REPLACE FUNCTION seed_default_milestones()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
    (NEW.id, 'Venue',        'not_started', true, 1),
    (NEW.id, 'Catering',     'not_started', true, 2),
    (NEW.id, 'Photography',  'not_started', true, 3),
    (NEW.id, 'Music',        'not_started', true, 4),
    (NEW.id, 'Flowers',      'not_started', true, 5),
    (NEW.id, 'Attire',       'not_started', true, 6),
    (NEW.id, 'Invitations',  'not_started', true, 7),
    (NEW.id, 'Honeymoon',    'not_started', true, 8),
    (NEW.id, 'Guest List',   'not_started', true, 9);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_milestones_trigger
  AFTER INSERT ON weddings
  FOR EACH ROW EXECUTE FUNCTION seed_default_milestones();

-- 4. Backfill existing weddings that have zero milestones
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM weddings
    WHERE id NOT IN (SELECT DISTINCT wedding_id FROM milestones)
  LOOP
    INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
      (r.id, 'Venue',        'not_started', true, 1),
      (r.id, 'Catering',     'not_started', true, 2),
      (r.id, 'Photography',  'not_started', true, 3),
      (r.id, 'Music',        'not_started', true, 4),
      (r.id, 'Flowers',      'not_started', true, 5),
      (r.id, 'Attire',       'not_started', true, 6),
      (r.id, 'Invitations',  'not_started', true, 7),
      (r.id, 'Honeymoon',    'not_started', true, 8),
      (r.id, 'Guest List',   'not_started', true, 9);
  END LOOP;
END $$;

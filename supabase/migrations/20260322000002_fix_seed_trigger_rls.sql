-- Fix: seed_default_milestones trigger runs before wedding_members row exists,
-- so get_my_wedding_id() returns NULL and milestones RLS blocks the insert.
-- SECURITY DEFINER makes the function run as its owner (postgres), bypassing RLS.
CREATE OR REPLACE FUNCTION seed_default_milestones()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION enforce_max_two_members()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wedding_members WHERE wedding_id = NEW.wedding_id) >= 2 THEN
    RAISE EXCEPTION 'Wedding already has 2 members';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER max_two_members_trigger
  BEFORE INSERT ON wedding_members
  FOR EACH ROW EXECUTE FUNCTION enforce_max_two_members();

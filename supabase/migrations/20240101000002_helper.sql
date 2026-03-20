CREATE OR REPLACE FUNCTION get_my_wedding_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid() LIMIT 1;
$$;

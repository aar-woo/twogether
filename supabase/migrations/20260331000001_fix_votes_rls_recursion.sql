-- Fix infinite recursion in votes_select policy.
-- The original policy did: EXISTS (SELECT 1 FROM votes WHERE ...)
-- which re-triggers the policy on the votes table → infinite recursion.
-- Solution: a SECURITY DEFINER function queries votes bypassing RLS.

CREATE OR REPLACE FUNCTION has_my_vote_on_option(p_option_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM votes WHERE option_id = p_option_id AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "votes_select" ON votes;

CREATE POLICY "votes_select" ON votes FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR has_my_vote_on_option(option_id)
  );

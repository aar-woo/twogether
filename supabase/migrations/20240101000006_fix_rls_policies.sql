-- Fix 1: weddings_select — let creator see their own wedding before wedding_members row exists
-- This is needed so INSERT...RETURNING works in createWeddingAction
DROP POLICY IF EXISTS "weddings_select" ON weddings;
CREATE POLICY "weddings_select" ON weddings FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR id = (SELECT get_my_wedding_id())
  );

-- Fix 2: ALL wedding_members policies must use only column-level expressions.
-- PostgreSQL's recursion guard fires at the table-access level: any subquery that
-- references wedding_members from within a wedding_members policy evaluation
-- triggers the guard, even through a SECURITY DEFINER function that bypasses RLS.
--
-- Phase 1 model: each user owns/sees only their own membership row.
-- Showing all members of a wedding (e.g. the partner) is a Phase 2+ concern.

DROP POLICY IF EXISTS "wedding_members_select" ON wedding_members;
CREATE POLICY "wedding_members_select" ON wedding_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wedding_members_insert" ON wedding_members;
CREATE POLICY "wedding_members_insert" ON wedding_members FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wedding_members_update" ON wedding_members;
CREATE POLICY "wedding_members_update" ON wedding_members FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wedding_members_delete" ON wedding_members;
CREATE POLICY "wedding_members_delete" ON wedding_members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

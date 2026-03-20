-- weddings
CREATE POLICY "weddings_select" ON weddings FOR SELECT TO authenticated
  USING (id = (SELECT get_my_wedding_id()));

CREATE POLICY "weddings_insert" ON weddings FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "weddings_update" ON weddings FOR UPDATE TO authenticated
  USING (id = (SELECT get_my_wedding_id()))
  WITH CHECK (id = (SELECT get_my_wedding_id()));

CREATE POLICY "weddings_delete" ON weddings FOR DELETE TO authenticated
  USING (id = (SELECT get_my_wedding_id()));

-- wedding_members (cannot use get_my_wedding_id — recursion risk; use self-join alias)
CREATE POLICY "wedding_members_select" ON wedding_members FOR SELECT TO authenticated
  USING (wedding_id IN (
    SELECT wedding_id FROM wedding_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "wedding_members_insert" ON wedding_members FOR INSERT TO authenticated
  WITH CHECK (
    wedding_id IN (
      SELECT wedding_id FROM wedding_members wm
      WHERE wm.user_id = (SELECT auth.uid())
    )
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "wedding_members_update" ON wedding_members FOR UPDATE TO authenticated
  USING (wedding_id IN (
    SELECT wedding_id FROM wedding_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (wedding_id IN (
    SELECT wedding_id FROM wedding_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "wedding_members_delete" ON wedding_members FOR DELETE TO authenticated
  USING (wedding_id IN (
    SELECT wedding_id FROM wedding_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  ));

-- milestones
CREATE POLICY "milestones_select" ON milestones FOR SELECT TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "milestones_insert" ON milestones FOR INSERT TO authenticated
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "milestones_update" ON milestones FOR UPDATE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()))
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "milestones_delete" ON milestones FOR DELETE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

-- decisions
CREATE POLICY "decisions_select" ON decisions FOR SELECT TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "decisions_insert" ON decisions FOR INSERT TO authenticated
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "decisions_update" ON decisions FOR UPDATE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()))
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "decisions_delete" ON decisions FOR DELETE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

-- decision_options
CREATE POLICY "decision_options_select" ON decision_options FOR SELECT TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "decision_options_insert" ON decision_options FOR INSERT TO authenticated
  WITH CHECK (decision_id IN (
    SELECT id FROM decisions WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "decision_options_update" ON decision_options FOR UPDATE TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE wedding_id = (SELECT get_my_wedding_id())
  ))
  WITH CHECK (decision_id IN (
    SELECT id FROM decisions WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "decision_options_delete" ON decision_options FOR DELETE TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

-- votes: SELECT uses visibility rule (both partners must vote before seeing each other's rating)
CREATE POLICY "votes_select" ON votes FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM votes my_vote
      WHERE my_vote.option_id = votes.option_id
        AND my_vote.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "votes_insert" ON votes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "votes_update" ON votes FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "votes_delete" ON votes FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- budget_categories
CREATE POLICY "budget_categories_select" ON budget_categories FOR SELECT TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "budget_categories_insert" ON budget_categories FOR INSERT TO authenticated
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "budget_categories_update" ON budget_categories FOR UPDATE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()))
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "budget_categories_delete" ON budget_categories FOR DELETE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

-- expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated
  USING (budget_category_id IN (
    SELECT id FROM budget_categories WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated
  WITH CHECK (budget_category_id IN (
    SELECT id FROM budget_categories WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated
  USING (budget_category_id IN (
    SELECT id FROM budget_categories WHERE wedding_id = (SELECT get_my_wedding_id())
  ))
  WITH CHECK (budget_category_id IN (
    SELECT id FROM budget_categories WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated
  USING (budget_category_id IN (
    SELECT id FROM budget_categories WHERE wedding_id = (SELECT get_my_wedding_id())
  ));

-- guests
CREATE POLICY "guests_select" ON guests FOR SELECT TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "guests_insert" ON guests FOR INSERT TO authenticated
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "guests_update" ON guests FOR UPDATE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()))
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "guests_delete" ON guests FOR DELETE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

-- invites: wedding-scoped only (service role handles token lookup in Phase 6)
CREATE POLICY "invites_select" ON invites FOR SELECT TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "invites_insert" ON invites FOR INSERT TO authenticated
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "invites_update" ON invites FOR UPDATE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()))
  WITH CHECK (wedding_id = (SELECT get_my_wedding_id()));

CREATE POLICY "invites_delete" ON invites FOR DELETE TO authenticated
  USING (wedding_id = (SELECT get_my_wedding_id()));

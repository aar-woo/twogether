# Concerns

**Analysis Date:** 2026-03-07

## Status

Pre-code scaffold. Concerns are forward-looking — identified from specs, docs, and planned architecture before any implementation.

## Critical Concerns

### 1. RLS Vote Visibility — High Complexity

**Location:** `supabase/migrations/005_decisions.sql` (planned)

The vote SELECT policy must hide each partner's rating until both have voted. This requires an `EXISTS` subquery on the same table:

```sql
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM votes my_vote
    WHERE my_vote.option_id = votes.option_id
      AND my_vote.user_id = (SELECT auth.uid())
  )
)
```

Risk: If this policy is written incorrectly, partners could see each other's ratings before both vote, undermining the core voting mechanic. Must be verified with SQL editor tests against two different user contexts.

### 2. `get_my_wedding_id()` Scalar Subquery Requirement

**Location:** Every RLS policy on wedding-scoped tables

The `STABLE` marker on `get_my_wedding_id()` does NOT guarantee single evaluation per query — Postgres may inline the function body and re-evaluate per row. Every policy MUST wrap the call in a scalar subquery:

```sql
-- Correct
USING (wedding_id = (SELECT get_my_wedding_id()))

-- WRONG — may cause per-row evaluation
USING (wedding_id = get_my_wedding_id())
```

Risk: Missing the `(SELECT ...)` wrapper causes severe performance degradation at scale and is not caught by functional tests — requires explicit EXPLAIN ANALYZE verification.

### 3. `wedding_members` Recursive Policy

**Location:** `supabase/migrations/003_rls_core.sql` (planned)

The `get_my_wedding_id()` helper queries `wedding_members`, so it cannot be used in `wedding_members` policies — it would cause infinite recursion. Must use the self-join with alias pattern:

```sql
USING (wedding_id IN (
  SELECT wedding_id FROM wedding_members wm
  WHERE wm.user_id = (SELECT auth.uid())
))
```

Risk: Using the helper function in the wrong policy causes a cryptic Postgres error. Easy to accidentally get wrong when copying policy patterns.

### 4. Invite Token Lookup — Service Role Required

**Location:** `src/app/api/invite/claim/route.ts` (planned)

Token-based invite lookup must use `SUPABASE_SERVICE_ROLE_KEY` server-side, not the anon key with RLS. RLS cannot express "a user with this token can read this invite" without leaking all invites.

Risk: If the claim route uses the anon Supabase client, it will get 0 rows back due to RLS, and the token lookup will silently fail. Must be verified during invite flow implementation.

### 5. Email Delivery — Open Question

**Location:** `SPEC.md` Open Questions #1

Partner invites require sending an email with the claim link. Supabase's built-in email is limited and not suitable for arbitrary transactional email. The v1 workaround (display the link in UI for copy-paste) avoids the dependency but degrades UX.

Resolution needed before Milestone 6. Options: Resend, SendGrid, or accept the copy-paste UX for v1.

## Architecture Concerns

### 6. No Optimistic UI — Sequential Vote Experience

The spec requires hiding ratings until both partners have voted. With server-rendered components and no Realtime, partner B won't see the score appear until they navigate away and back (or manually refresh). The spec marks Realtime as v2.

Impact: Slightly awkward UX when partner B submits their vote and expects immediate feedback. Acceptable for v1 but worth noting for polish phase.

### 7. Max-2 Members Enforced by Trigger Only

The `enforce_max_two_members` BEFORE INSERT trigger is the sole enforcement of the 2-member limit. RLS cannot count rows. Application code should also check member count before showing the invite UI, but the database is the authoritative guard.

Risk: If the trigger is missing from a migration, no error is shown — a third member can silently join.

## Performance Concerns

### 8. RLS Index Coverage

Every policy that filters by `wedding_id` or `user_id` must be backed by an index. The planned `002_rls_helpers.sql` migration adds these indexes. If this migration is skipped or the index is dropped, queries will degrade to sequential scans as data grows.

Indexes required (documented in `docs/supabase.md`):
- `wedding_members(user_id)`, `wedding_members(wedding_id)`
- `milestones(wedding_id)`, `decisions(wedding_id)`, `votes(option_id)`, `votes(user_id)`, etc.

### 9. `decision_options` and `expenses` Two-Hop Joins

These tables have no direct `wedding_id` column — access goes through the parent table:
- `decision_options` → `decisions` → `wedding_id`
- `expenses` → `budget_categories` → `wedding_id`

RLS policies for these require a subquery join, which is more expensive than a direct column comparison. Watch query plans if these tables grow large.

## Technical Debt (Pre-Implementation)

### 10. No `package.json` Yet

The project scaffold has no `package.json`, `next.config.ts`, or any installed dependencies. All scaffold work is in Milestone 1. Nothing can run until Milestone 1 is complete.

### 11. `types/supabase.ts` Must Be Regenerated After Every Migration

The generated types file must stay in sync with the database schema. There is no automation for this — it is a manual step (`supabase gen types typescript`). Stale types cause silent runtime errors that TypeScript won't catch until the types are regenerated.

### 12. No Error Boundaries or Loading UI Specified

`TODOS.md` Milestone 7 mentions loading states and error handling as polish items, not first-class requirements. The risk is that early milestones ship without loading states, making the app feel broken on slow connections.

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in `NEXT_PUBLIC_*` env vars
- The `votes` table is the most security-sensitive: incorrect RLS here lets partners game the voting system by seeing each other's ratings before committing
- Invite tokens are single-use but not time-limited in the current schema — consider adding `expires_at` if abuse is a concern

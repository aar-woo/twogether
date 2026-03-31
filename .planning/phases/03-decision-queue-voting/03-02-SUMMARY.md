---
phase: 03-decision-queue-voting
plan: "02"
subsystem: ui
tags: [nextjs, supabase, rls, postgrest, react]

requires:
  - phase: 03-01
    provides: DecisionWithOptions type, phase 3 schema migration

provides:
  - /decisions queue page (Server Component) fetching decisions with nested options+votes
  - getDecisions(weddingId) server action with explicit wedding filter
  - createDecision and reorderDecision server actions
  - DecisionQueue client component with inline new-decision form
  - DecisionCard client component with status chip, vote-status summary, up/down reorder

affects:
  - 03-03 (detail page depends on decisions existing in queue)

tech-stack:
  added: []
  patterns: [server-action-query, router-refresh-after-mutation, explicit-wedding-filter]

key-files:
  created:
    - src/app/(app)/decisions/page.tsx
    - src/app/(app)/decisions/actions.ts
    - src/app/(app)/decisions/DecisionQueue.tsx
    - src/app/(app)/decisions/DecisionCard.tsx
    - supabase/migrations/20260331000001_fix_votes_rls_recursion.sql
  modified: []

key-decisions:
  - "getDecisions accepts weddingId param and filters explicitly — RLS auth context unreliable in server actions"
  - "PostgREST FK disambiguation: decision_options!decision_options_decision_id_fkey — required after resolved_option_id FK added in 03-01"
  - "votes_select RLS recursion fixed via has_my_vote_on_option() SECURITY DEFINER function"
  - "router.refresh() required after mutations — revalidatePath alone does not re-render client component tree"
  - "DecisionQueue wrapped in max-w-2xl mx-auto for 2/3-width centered layout"

patterns-established:
  - "Query pattern: pass weddingId explicitly from page.tsx into server actions rather than relying on RLS get_my_wedding_id()"
  - "Mutation pattern: call router.refresh() in client component after server action succeeds to trigger server re-render"
  - "PostgREST embed disambiguation: use !fkey_name syntax when multiple FKs exist between two tables"

requirements-completed:
  - DECI-01
  - DECI-08

duration: ~90min (including debugging)
completed: 2026-03-31
---

# Plan 03-02: Decision Queue Page Summary

**`/decisions` queue with inline create form, vote-status cards, and persistent up/down reordering — three RLS/PostgREST issues diagnosed and fixed during execution**

## Performance

- **Duration:** ~90 min (including debugging)
- **Completed:** 2026-03-31
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 5 (including 1 migration)

## Accomplishments
- `/decisions` page renders all wedding decisions with nested options and votes
- Inline "New Decision" form creates decisions and re-renders immediately via `router.refresh()`
- Decision cards show title, Open/Resolved status chip, and vote-status summary line
- Up/Down buttons reorder open decisions; order persists on refresh
- Fixed votes RLS infinite recursion via `has_my_vote_on_option()` SECURITY DEFINER function

## Task Commits

1. **Task 1: Queue page + actions** — `39e4e9cc` feat(03-02): add decisions queue server page and server actions
2. **Task 2: DecisionCard + DecisionQueue** — `218e6621` feat(03-02): add DecisionCard and DecisionQueue client components
3. **Task 3: Human verify + fixes** — `bdae05c1` fix(03-02): fix decisions queue rendering and votes RLS recursion

## Files Created/Modified
- `src/app/(app)/decisions/page.tsx` — Server Component; auth+wedding guard, calls getDecisions(wedding.id)
- `src/app/(app)/decisions/actions.ts` — getDecisions, createDecision, reorderDecision server actions
- `src/app/(app)/decisions/DecisionQueue.tsx` — Client; inline form, list of DecisionCards, router.refresh() after mutations
- `src/app/(app)/decisions/DecisionCard.tsx` — Client; title, status chip, vote-status summary, up/down buttons
- `supabase/migrations/20260331000001_fix_votes_rls_recursion.sql` — SECURITY DEFINER helper to break votes policy recursion

## Decisions Made
- Moved data query from page.tsx into `getDecisions(weddingId)` in actions.ts per project convention (queries colocated with actions)
- Pass `weddingId` explicitly from page.tsx instead of relying on `get_my_wedding_id()` in action context
- `currentUserId` removed from `getDecisions()` return — `user.id` already available in page.tsx

## Deviations from Plan

### Auto-fixed Issues

**1. PostgREST PGRST201 — ambiguous decision_options embed**
- **Found during:** Human verify (query returned error)
- **Issue:** Phase 03-01 added `decisions_resolved_option_id_fkey` FK; PostgREST now sees two paths between decisions and decision_options
- **Fix:** Changed select to `decision_options!decision_options_decision_id_fkey (...)`
- **Files modified:** src/app/(app)/decisions/actions.ts
- **Committed in:** bdae05c1

**2. votes_select RLS infinite recursion (42P17)**
- **Found during:** Human verify (after FK fix, new error surfaced)
- **Issue:** `votes_select` policy used `EXISTS (SELECT 1 FROM votes ...)` — self-referencing the same table triggers PostgreSQL's recursion guard
- **Fix:** Extracted subquery into `has_my_vote_on_option(p_option_id uuid)` SECURITY DEFINER function; updated policy to call the function
- **Files modified:** supabase/migrations/20260331000001_fix_votes_rls_recursion.sql
- **Committed in:** bdae05c1

---

**Total deviations:** 2 auto-fixed (1 PostgREST schema issue, 1 RLS recursion bug)
**Impact on plan:** Both fixes necessary for the feature to function. No scope creep.

## Issues Encountered
- Data query initially returned null even with correct weddingId — root cause was the PGRST201 ambiguity causing a PostgREST error that was being swallowed silently before error logging was added

## Next Phase Readiness
- Decision queue fully functional; clicking a card navigates to `/decisions/[id]` (currently 404)
- 03-03 can proceed: detail page, option voting, compatibility score reveal, and resolve flow

---
*Phase: 03-decision-queue-voting*
*Completed: 2026-03-31*

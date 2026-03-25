---
phase: 03-decision-queue-voting
plan: "01"
subsystem: database
tags: [supabase, postgres, typescript, migrations, types]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: decisions, decision_options, votes tables created without FK constraint
  - phase: 02-dashboard-progress-map
    provides: established migration workflow (supabase db reset pattern)
provides:
  - FK constraint decisions.resolved_option_id -> decision_options(id) ON DELETE SET NULL
  - Decision, DecisionOption, Vote domain interfaces in types/index.ts
  - OptionWithVotes, DecisionWithOptions enriched types for page data fetches
  - OptionVoteState union type for RLS-filtered vote UI state
  - Regenerated types/supabase.ts reflecting full phase3 schema
affects:
  - 03-decision-queue-voting (plans 02 and 03 consume all types defined here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - OptionVoteState union type derived from RLS-filtered vote count (0/1/2 visible rows)
    - ON DELETE SET NULL FK allows winning option deletion to gracefully reopen decision

key-files:
  created:
    - supabase/migrations/20260324000001_phase3_schema.sql
  modified:
    - types/index.ts
    - types/supabase.ts

key-decisions:
  - "ON DELETE SET NULL on decisions.resolved_option_id — deleting the winning option reopens the decision rather than cascading deletes"
  - "OptionVoteState union type driven by RLS-visible vote count: 0=unvoted, 1=you_voted, 2=both_voted — no extra RLS complexity needed"

patterns-established:
  - "OptionVoteState: derive UI state from count of RLS-visible rows, not explicit flags"

requirements-completed: [DECI-01, DECI-02, DECI-03, DECI-04, DECI-05, DECI-06, DECI-07, DECI-08]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 3 Plan 01: Schema Migration + Domain Type Contracts Summary

**FK constraint on decisions.resolved_option_id with ON DELETE SET NULL, plus Decision/Vote/OptionVoteState domain types establishing the type contracts for all Phase 3 plans**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T05:12:22Z
- **Completed:** 2026-03-25T05:13:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Applied FK constraint on `decisions.resolved_option_id` referencing `decision_options(id)` with ON DELETE SET NULL
- Regenerated `types/supabase.ts` from live local stack after migration (FK now visible in generated types)
- Added 6 interfaces + 1 union type (Decision, DecisionOption, Vote, OptionWithVotes, DecisionWithOptions, OptionVoteState) to `types/index.ts`
- Zero TypeScript errors after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply Phase 3 schema migration** - `01a404f8` (chore)
2. **Task 2: Add Phase 3 domain types to types/index.ts** - `00dbfea8` (feat)

## Files Created/Modified
- `supabase/migrations/20260324000001_phase3_schema.sql` - FK constraint: decisions.resolved_option_id -> decision_options(id) ON DELETE SET NULL
- `types/index.ts` - Added Decision, DecisionOption, Vote, OptionWithVotes, DecisionWithOptions, OptionVoteState
- `types/supabase.ts` - Regenerated from local stack; now includes decisions_resolved_option_id_fkey

## Decisions Made
- ON DELETE SET NULL on the FK: deleting a winning option gracefully reopens the decision (no cascade, no orphan resolved_option_id)
- OptionVoteState union type uses count of RLS-visible vote rows (0/1/2) as the signal — no extra flags or columns needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 type contracts established; Plans 02 and 03 can import Decision, DecisionWithOptions, OptionVoteState without re-defining
- Schema is complete for decision queue feature; RLS policies for votes table to be added in Plan 02 or 03
- No blockers

---
*Phase: 03-decision-queue-voting*
*Completed: 2026-03-25*

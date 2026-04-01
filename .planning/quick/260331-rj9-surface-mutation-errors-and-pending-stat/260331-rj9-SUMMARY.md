---
phase: quick
plan: 260331-rj9
subsystem: ui
tags: [react, next.js, useTransition, error-handling]

requires: []
provides:
  - Inline error display for createDecision, addOption, and resolveDecision mutations
  - Reorder buttons disabled with opacity-50 visual feedback during in-flight transitions
affects: [decisions-ui]

tech-stack:
  added: []
  patterns:
    - "Mutation error pattern: useState<string|null> + setError(null) before action + else setError(result.error)"
    - "isPending threading: extract from useTransition in parent, pass as isReordering prop to child"

key-files:
  created: []
  modified:
    - src/app/(app)/decisions/DecisionQueue.tsx
    - src/app/(app)/decisions/DecisionCard.tsx
    - src/app/(app)/decisions/[id]/OptionList.tsx

key-decisions:
  - "isReordering uses parent's isPending — all reorder buttons disable together, preventing race conditions from rapid clicking"
  - "resolveDecision now only calls router.refresh() on success path — error path skips refresh and shows error text"

patterns-established:
  - "Mutation error display: <p className='text-sm text-destructive'>{error}</p> below the triggering button"
  - "Pending state: disabled={condition || isReordering} + opacity-50 class for visual feedback"

requirements-completed: []

duration: 8min
completed: 2026-03-31
---

# Quick Task 260331-rj9: Surface Mutation Errors and Pending State Summary

**Inline error display added to all three mutation paths (createDecision, addOption, resolveDecision) and reorder buttons now disable with opacity-50 during in-flight transitions.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T00:00:00Z
- **Completed:** 2026-03-31T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- createDecision failures now show inline error text below Submit/Cancel buttons in DecisionQueue
- addOption and resolveDecision failures show inline error text in OptionList (separate states for each)
- Reorder buttons in DecisionCard show disabled + opacity-50 state while any reorder transition is in-flight
- resolveDecision now only calls router.refresh() on success, not on error

## Task Commits

1. **Tasks 1+2: Surface mutation errors and reorder pending state** - `d4f0268a` (fix)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/app/(app)/decisions/DecisionQueue.tsx` - Added error state for createDecision, extracted isPending, passes isReordering to DecisionCard
- `src/app/(app)/decisions/DecisionCard.tsx` - Added isReordering prop; reorder buttons disabled + opacity-50 when pending
- `src/app/(app)/decisions/[id]/OptionList.tsx` - Added addError/resolveError states; resolveDecision only refreshes on success

## Decisions Made

- Tasks 1 and 2 both modify DecisionQueue.tsx (isPending extraction spans both), committed as a single atomic commit.
- isReordering prop uses the parent's isPending so all reorder buttons disable simultaneously — prevents race conditions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Error UX patterns are now consistent with OptionCard.tsx across all mutation surfaces
- Reorder pending state prevents double-submit race conditions

## Self-Check: PASSED

- `d4f0268a` commit exists in git log
- All 3 files modified and committed
- TypeScript (`npx tsc --noEmit`) passes clean

---
*Phase: quick*
*Completed: 2026-03-31*

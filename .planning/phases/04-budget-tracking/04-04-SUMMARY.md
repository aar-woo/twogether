---
phase: 04-budget-tracking
plan: "04"
subsystem: ui
tags: [react, server-actions, supabase, next.js, budget]

# Dependency graph
requires:
  - phase: 04-budget-tracking/04-02
    provides: BudgetClient.tsx stat cards and over-budget warning UI; weddings.total_budget column via prior migration
  - phase: 04-budget-tracking/04-03
    provides: Cosmetic fixes including Cancel button labels and isOverAllocated fix
provides:
  - updateTotalBudget server action in actions.ts writing to weddings.total_budget
  - Inline edit control (pencil → input → save/cancel) on Total Budget stat card in BudgetClient.tsx
affects:
  - 04-budget-tracking/UAT
  - any future phase touching budget UI or weddings.total_budget

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline edit stat card: pencil icon appears on hover (group/opacity-0/group-hover:opacity-100), click enters edit mode, Save/Cancel buttons"
    - "weddingId passed from client to server action directly (not re-derived via wedding_members join)"

key-files:
  created: []
  modified:
    - src/app/(app)/budget/actions.ts
    - src/app/(app)/budget/BudgetClient.tsx

key-decisions:
  - "updateTotalBudget accepts weddingId directly from client instead of re-deriving via wedding_members join — RLS on weddings table enforces membership, making the join redundant"
  - "Total Budget stat card broken out of generic budgetCards.map() loop to support inline edit UI; other 3 cards remain in generic map"
  - "Pencil icon uses group-hover opacity pattern so it doesn't clutter the card visually until hovered"

patterns-established:
  - "Inline edit stat card: split editable card out of generic map, use isEditing boolean state + input state, pencil icon triggers edit mode"

requirements-completed:
  - BUDG-01
  - BUDG-02

# Metrics
duration: ~15min
completed: 2026-04-07
---

# Phase 04 Plan 04: Total Budget Inline Edit Summary

**Pencil-to-input inline edit on the Total Budget stat card backed by a `updateTotalBudget` server action writing directly to `weddings.total_budget`**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Added `updateTotalBudget(weddingId, amount)` server action to actions.ts — updates `weddings.total_budget`, dual-revalidates `/budget` and `/dashboard`
- Broke Total Budget stat card out of the generic map; added pencil icon (visible on hover), edit input, Save/Cancel buttons
- Human verification confirmed: pencil renders on hover, edit mode works, value persists on refresh, over-budget warning responds correctly to budget changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add updateTotalBudget server action to actions.ts** - `cc63cebc` (feat)
2. **Task 2: Add inline edit control to Total Budget stat card in BudgetClient.tsx** - `253646d5` (feat)
3. **Task 3: Human verify Total Budget inline edit end-to-end** - approved (checkpoint)
4. **Deviation fix: updateTotalBudget signature change** - `503a669e` (fix)

## Files Created/Modified

- `src/app/(app)/budget/actions.ts` — Added `updateTotalBudget(weddingId, amount)` server action
- `src/app/(app)/budget/BudgetClient.tsx` — Added `isEditingTotalBudget` state, `handleSaveTotalBudget` handler, inline edit card UI with pencil icon

## Decisions Made

- `updateTotalBudget` was initially implemented with a `wedding_members` lookup (as specified in the plan). After the checkpoint, the signature was revised to accept `weddingId` directly from the caller. Since BudgetClient already has `wedding.id` from the server-fetched props and RLS on the `weddings` table enforces membership, the extra join was unnecessary complexity.
- Total Budget card broken out of the generic `budgetCards.map()` to render its own inline edit UI. The other three stat cards (Allocated, Spent, Remaining) remain in the generic map.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] updateTotalBudget signature changed from (amount) to (weddingId, amount)**
- **Found during:** Post-checkpoint review
- **Issue:** Original implementation used a `wedding_members` join to find the user's wedding. BudgetClient already holds `wedding.id` from server-fetched props. Passing it directly simplifies the action and removes a redundant DB round-trip.
- **Fix:** Added `weddingId: string` as first parameter, removed `wedding_members` select, updated `weddings.update().eq("id", weddingId)`. Updated call site in BudgetClient.tsx to `updateTotalBudget(wedding.id, parsed)`.
- **Files modified:** `src/app/(app)/budget/actions.ts`, `src/app/(app)/budget/BudgetClient.tsx`
- **Verification:** `npx tsc --noEmit` exits 0; human checkpoint confirmed end-to-end flow works
- **Committed in:** `503a669e`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/simplification)
**Impact on plan:** Minor signature refinement after initial implementation. No scope change.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all data flows are wired. The Total Budget stat card reads from `wedding.totalBudget` (server-fetched), saves via `updateTotalBudget`, and the over-budget warning reflects changes immediately.

## Next Phase Readiness

- Total Budget is now user-settable, making the over-budget warning fully functional
- UAT gap items BUDG-01 and BUDG-02 are closed
- Phase 04 budget tracking is complete

---
*Phase: 04-budget-tracking*
*Completed: 2026-04-07*

---
phase: 04-budget-tracking
plan: "03"
subsystem: budget
tags: [bug-fix, ui, uat-gap-closure]
dependency_graph:
  requires: []
  provides: [isOverAllocated-fix, amber-pending-button, cancel-labels]
  affects: [src/app/(app)/budget/BudgetClient.tsx]
tech_stack:
  added: []
  patterns: [tailwind-amber-palette]
key_files:
  created: []
  modified:
    - src/app/(app)/budget/BudgetClient.tsx
decisions:
  - "isOverAllocated condition simplified to allocated > totalBudget — the && totalBudget > 0 guard was suppressing the warning when budget is $0, which is a valid state that should warn"
  - "Pending toggle buttons use amber-100/700/300 to match the Pending badge pill; Paid keeps sage-500 for visual distinction"
  - "Cancel is the universal label for dismissing forms/confirmations — Discard was inconsistent with the rest of the app"
metrics:
  duration: "2min"
  completed_date: "2026-04-08"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 04 Plan 03: Budget Cosmetic Fixes Summary

Three targeted UAT-failure fixes in BudgetClient.tsx — corrected isOverAllocated zero-budget guard, amber Pending toggle button styles, and uniform "Cancel" button labels.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix isOverAllocated condition and amber Pending button styles | 12cd151b | BudgetClient.tsx |
| 2 | Replace all Discard button labels with Cancel | fe35ed9f | BudgetClient.tsx |

## What Was Built

**Fix 1 — isOverAllocated condition (line 87):**
Removed the `&& wedding.totalBudget > 0` guard. The over-budget banner now shows whenever `allocated > totalBudget`, including when totalBudget is $0 (which means any allocation triggers the warning).

**Fix 2 — Amber Pending toggle buttons:**
Both status toggle groups (edit-expense form and add-expense form) now use `bg-amber-100 text-amber-700 border-amber-300` for the active Pending state. This matches the amber Pending badge pill shown on expense rows. Paid buttons retain `bg-sage-500 text-white border-sage-500`.

**Fix 3 — Cancel button labels:**
All 6 cancel/discard buttons across the file now display "Cancel":
1. New-category form cancel
2. Delete-category confirmation cancel
3. Edit-category form cancel
4. Delete-expense confirmation cancel
5. Edit-expense form cancel
6. Add-expense form cancel

## Verification

- `grep -c "Discard" BudgetClient.tsx` returns 0
- `grep "isOverAllocated"` shows `allocated > wedding.totalBudget` without the `&& wedding.totalBudget > 0` guard
- `grep -c "bg-amber-100 text-amber-700 border-amber-300"` returns 2 (one per toggle group)
- `npx tsc --noEmit` exits 0
- `npx eslint src/app/(app)/budget/BudgetClient.tsx` exits 0

## Deviations from Plan

None — plan executed exactly as written. The lint failures observed from `npm run lint` are all pre-existing issues in `.claude/get-shit-done/bin/` tooling files and `layout.tsx`, not caused by this plan's changes.

## Known Stubs

None — all changes are correctness fixes, no stubs introduced.

## Self-Check: PASSED

- BudgetClient.tsx modified: FOUND
- Commit 12cd151b: FOUND
- Commit fe35ed9f: FOUND

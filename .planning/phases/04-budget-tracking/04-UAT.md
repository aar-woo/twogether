---
status: diagnosed
phase: 04-budget-tracking
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Budget page loads
expected: Visit http://localhost:3000/budget while logged in. You should see 4 stat cards across the top: Total Budget, Allocated, Spent, and Remaining — all showing $0 or the wedding's set budget amount. Below the cards, an empty state with a heading and a "+ New Category" button (no accordion rows yet).
result: pass

### 2. Create a budget category
expected: Click "+ New Category". An inline form appears with fields for name and allocated amount. Enter a name (e.g. "Catering") and an amount (e.g. 5000). Submit. The form closes and a "Catering" row appears in the accordion list, collapsed.
result: pass

### 3. Allocated stat updates after category creation
expected: After creating the "Catering" category with $5,000 allocated, the "Allocated" stat card updates to $5,000 and "Remaining" decreases accordingly. No page reload required.
result: pass
note: "User noted Total Budget is 0 with no way to set it — logged as separate gap"

### 4. Expand accordion and add an expense
expected: Click the "Catering" row to expand the accordion. The row expands to reveal an expense list (empty) and an "+ Add expense" button at the bottom. Click it — a form appears with fields for vendor name, amount, and status (Paid/Pending toggle). Enter a vendor name (e.g. "Chef Mario's") and $2,000. Leave status as Pending. Submit. The expense appears in the list with an amber "Pending" badge.
result: issue
reported: "Pass, but change the status selection buttons to match color so pending is also amber."
severity: cosmetic

### 5. Paid vs Pending badge colors
expected: Pending expenses have an amber badge labeled "Pending". Click the pencil/edit icon on the expense. Toggle the status button from "Pending" to "Paid". Save. The expense now shows a sage green badge labeled "Paid".
result: pass

### 6. Spent stat updates after marking paid
expected: After marking the $2,000 expense as "Paid", the "Spent" stat card increases to $2,000 and "Remaining" decreases by $2,000. Numbers update without page reload.
result: pass

### 7. Edit a category inline
expected: Click the pencil icon on a category row. The name and allocated amount become editable in place. Change the allocated amount (e.g. to 6000). Click Save. The row updates immediately with the new amount and the Allocated stat card updates.
result: pass

### 8. Edit an expense inline
expected: Click an expense row (or its edit/pencil icon). It enters edit mode with pre-filled fields. Change the vendor name. Click Save. The expense row updates with the new name immediately.
result: pass

### 9. Delete an expense with confirmation
expected: Click the trash icon on an expense. An inline confirmation message appears (e.g. "Delete this expense?") with Confirm and Cancel options — no modal dialog. Click Confirm. The expense is removed from the list.
result: issue
reported: "Pass but change wording of cancel button from 'discard' to 'cancel'"
severity: cosmetic

### 10. Delete a category with confirmation
expected: Click the trash icon on a category. An inline confirmation appears reading "Delete category and all its expenses?" with Confirm and Cancel. Click Confirm. The category and all its expenses are removed. If it was the last category, the empty state reappears.
result: issue
reported: "Pass but same as deleting expense, change 'discard' to 'cancel'"
severity: cosmetic

### 11. Over-budget warning
expected: Create categories whose total allocated amount exceeds the wedding's total budget. An amber warning banner appears below the 4 stat cards (something like "Allocated budget exceeds total budget"). The banner disappears if you reduce allocated amounts or delete a category so total allocated is within budget.
result: issue
reported: "Fail, unable to set total budget so budget is $0 and I have an allocated of $5000, and see no warning banner."
severity: major

### 12. Multiple categories open simultaneously
expected: Create a second category (e.g. "Flowers"). Expand both "Catering" and "Flowers" accordion rows at the same time. Both should stay expanded independently — opening one does not close the other.
result: pass

### 13. Dashboard budget totals reflect budget page
expected: Visit /dashboard. The budget summary section (if present on dashboard) should reflect the categories/expenses you've created — totals should match what you see on /budget.
result: pass

## Summary

total: 13
passed: 9
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Pending status toggle button is amber-colored to match the Pending badge"
  status: failed
  reason: "User reported: status selection buttons don't match badge colors — Pending button should be amber"
  severity: cosmetic
  test: 4
  root_cause: "Both status toggle buttons apply the same active class (bg-sage-500 text-white border-sage-500) — no amber variant for Pending. Both add-expense form (lines 651-670) and edit-expense form (lines 534-554) are affected."
  artifacts:
    - path: "src/app/(app)/budget/BudgetClient.tsx"
      issue: "Pending button active class uses sage-500 instead of amber-100/700"
  missing:
    - "Change Pending button active class to bg-amber-100 text-amber-700 border-amber-300 in both form locations"
  debug_session: .planning/debug/budget-cosmetic-fixes.md

- truth: "Cancel button in delete confirmation is labeled 'Cancel' not 'Discard'"
  status: failed
  reason: "User reported: cancel button says 'Discard' — should say 'Cancel'"
  severity: cosmetic
  test: 9
  root_cause: "Hardcoded string 'Discard' on cancel buttons in delete confirmations (~line 402 category, ~line 509 expense). Also appears in edit-form cancel buttons throughout file."
  artifacts:
    - path: "src/app/(app)/budget/BudgetClient.tsx"
      issue: "'Discard' hardcoded in delete confirmation cancel buttons at ~lines 402 and 509"
  missing:
    - "Replace 'Discard' with 'Cancel' on all cancel buttons in BudgetClient.tsx (delete confirmations + edit forms for consistency)"
  debug_session: .planning/debug/budget-cosmetic-fixes.md

- truth: "Over-budget warning banner appears when allocated amount exceeds total budget"
  status: failed
  reason: "User reported: no warning banner shown even with $0 total budget and $5,000 allocated — warning condition (allocated > totalBudget) not triggering"
  severity: major
  test: 11
  root_cause: "Line 87 of BudgetClient.tsx: `const isOverAllocated = allocated > wedding.totalBudget && wedding.totalBudget > 0` — the second clause silences the warning whenever totalBudget is 0. With null DB value coerced to 0 by page.tsx, the banner can never render."
  artifacts:
    - path: "src/app/(app)/budget/BudgetClient.tsx"
      issue: "isOverAllocated condition (line 87) guards with `&& wedding.totalBudget > 0`, suppressing banner when budget is unset"
  missing:
    - "Remove `&& wedding.totalBudget > 0` guard — condition should simply be `allocated > wedding.totalBudget`"
  debug_session: .planning/debug/budget-overbudget-warning.md

- truth: "User can set the wedding's total budget amount"
  status: failed
  reason: "User reported: Total Budget defaults to 0 with no way to set it on the budget page"
  severity: major
  test: 3
  root_cause: "Feature never planned or built. No updateTotalBudget server action exists anywhere in the codebase. Total Budget stat card in BudgetClient.tsx is display-only with no edit control. Settings page (Phase 6) doesn't exist yet."
  artifacts:
    - path: "src/app/(app)/budget/actions.ts"
      issue: "Missing updateTotalBudget server action — no write path to weddings.total_budget"
    - path: "src/app/(app)/budget/BudgetClient.tsx"
      issue: "Total Budget stat card is display-only, no pencil/edit control"
  missing:
    - "Add updateTotalBudget(amount: number) server action in actions.ts (update weddings.total_budget via wedding_members lookup)"
    - "Add inline edit control on Total Budget stat card (pencil → input → save/cancel pattern)"
  debug_session: .planning/debug/budget-total-budget-setter.md

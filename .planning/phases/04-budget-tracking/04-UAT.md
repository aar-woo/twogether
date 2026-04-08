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
  artifacts: []
  missing: ["amber active state on Pending toggle button in expense form (bg-amber-100 text-amber-700 when active)"]

- truth: "Cancel button in delete confirmation is labeled 'Cancel' not 'Discard'"
  status: failed
  reason: "User reported: cancel button says 'Discard' — should say 'Cancel'"
  severity: cosmetic
  test: 9
  artifacts: []
  missing: ["rename 'Discard' → 'Cancel' in all delete confirmation inline UI (both expense and category)"]

- truth: "Over-budget warning banner appears when allocated amount exceeds total budget"
  status: failed
  reason: "User reported: no warning banner shown even with $0 total budget and $5,000 allocated — warning condition (allocated > totalBudget) not triggering"
  severity: major
  test: 11
  artifacts: []
  missing: ["over-budget warning banner logic — likely suppressed when totalBudget is 0/null instead of treating 0 as a valid threshold"]

- truth: "User can set the wedding's total budget amount"
  status: failed
  reason: "User reported: Total Budget defaults to 0 with no way to set it on the budget page"
  severity: major
  test: 3
  artifacts: []
  missing: ["Total budget input field or edit control on /budget page (or in settings)"]

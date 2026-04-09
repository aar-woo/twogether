---
status: partial
phase: 05-guest-list
source: [05-VERIFICATION.md]
started: 2026-04-08T00:00:00.000Z
updated: 2026-04-08T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Add 5 guests with varied side/relationship values; all summary counts are correct
expected: After adding 5 guests with different side (Bride/Groom/Both) and relationship (Family/Friend/Colleague/Plus One) values, the summary section shows correct totals for each category
result: [pending]

### 2. Toggle `invited` on a guest; total invited count updates immediately
expected: Clicking the invited toggle on a guest row updates the "Invited" summary count instantly without a page reload (optimistic update)
result: [pending]

### 3. Delete a guest; all summary counts update correctly
expected: Deleting a guest removes them from the table and the summary counts (by side, by relationship, total) all decrement correctly
result: [pending]

### 4. Edit a guest's side/relationship; breakdown counts update
expected: Changing a guest's side or relationship via inline edit causes the summary breakdown counts to update correctly
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

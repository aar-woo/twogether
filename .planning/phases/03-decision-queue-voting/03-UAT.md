---
status: complete
phase: 03-decision-queue-voting
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-03-31T00:00:00Z
updated: 2026-03-31T00:00:00Z
---

## Current Test

<!-- OVERWRITE each test - shows where we are -->

[testing complete]


## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Decision Queue Page Renders
expected: Navigate to /decisions. The page loads and shows a list of wedding decisions. Each card shows the decision title, an Open or Resolved status chip, and a vote-status summary line (e.g. "0/2 voted").
result: pass

### 3. Create New Decision
expected: On the /decisions page, there is an inline "New Decision" form. Enter a title and submit. The new decision appears in the list immediately without a full page reload. It shows as "Open" with no votes yet.
result: pass

### 4. Reorder Decisions
expected: Each Open decision card has Up and Down buttons. Clicking them changes the order of decisions in the list. The order persists after refreshing the page.
result: pass

### 5. Decision Detail Page
expected: Click on a decision card from the queue. You are taken to /decisions/[id]. The page shows the decision title, a back link, and the list of options for that decision.
result: pass
note: Fixed — PostgREST PGRST201 FK ambiguity; getDecision() added to actions.ts

### 6. Vote on an Option
expected: On the detail page, each option has a vote button/form. Submitting a vote updates the option card to show your vote. The card changes appearance to indicate "you voted" state.
result: pass

### 7. Compatibility Score Reveals After Both Vote
expected: When both partners have voted on the same option, a compatibility bar (CompatibilityBar) appears showing a score. The bar is a visual progress bar.
result: pass
note: Score formula updated to avg-based with high/low weighting

### 8. Add Option to Decision
expected: On the decision detail page, there is an "Add option" inline form. Enter a description and submit. The new option appears in the list immediately without a full page reload.
result: pass

### 9. Resolve Decision (Pick Winner)
expected: On the detail page, each option has a "Select as winner" button. Clicking it marks the decision as Resolved and highlights the winning option. The decision in the queue (/decisions) now shows the Resolved status chip.
result: pass

## Summary

total: 9
passed: 9
issues: 0
skipped: 0
pending: 0

## Gaps

[none yet]

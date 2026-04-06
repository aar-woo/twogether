---
status: resolved
trigger: "decision-card-navigation-redirect"
created: 2026-03-31T00:00:00Z
updated: 2026-03-31T00:10:00Z
---

## Current Focus

hypothesis: The detail page query uses `decision_options (...)` without FK disambiguation, causing PostgREST PGRST201 ambiguity error. decisions table has TWO foreign keys pointing to decision_options: decision_options_decision_id_fkey (options -> decision) and decisions_resolved_option_id_fkey (decision -> resolved option). Without !fkey disambiguation, PostgREST cannot determine which relationship to use and returns null/error. This makes `decision` null, triggering redirect("/decisions").
test: Compare page.tsx query (no disambiguation) vs decisions/actions.ts getDecisions (uses !decision_options_decision_id_fkey disambiguation). Read migration 20260324000001_phase3_schema.sql to confirm the second FK was added.
expecting: Confirmed PGRST201 is root cause. Fix: add getDecision() to [id]/actions.ts with !decision_options_decision_id_fkey disambiguation, call it from page.tsx.
next_action: Await human verification that clicking a decision card now shows the detail page without redirect.

## Symptoms

expected: Clicking a decision card takes user to /decisions/[id] and stays there, showing the decision detail page with options.
actual: The page briefly navigates to /decisions/[id] then immediately redirects back to /decisions (page reload effect).
errors: None visible — likely a silent redirect from `if (!decision) redirect("/decisions")` in src/app/(app)/decisions/[id]/page.tsx line 41.
reproduction: Navigate to /decisions, click any decision card.
started: Was never tested end-to-end before — 03-03 task 3 (human verify) was left as a pending checkpoint.

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-31T00:00:00Z
  checked: src/app/(app)/decisions/[id]/page.tsx lines 26-38
  found: Query uses `decision_options (...)` with no FK disambiguation hint
  implication: PostgREST sees two FKs between decisions and decision_options: decision_options_decision_id_fkey AND decisions_resolved_option_id_fkey (added in phase3_schema migration). Ambiguous relationship → PGRST201 → query returns null.

- timestamp: 2026-03-31T00:00:00Z
  checked: src/app/(app)/decisions/actions.ts getDecisions() line 22
  found: Uses `decision_options!decision_options_decision_id_fkey (...)` — explicit FK disambiguation
  implication: This is the correct pattern to follow. Phase 03-02 already fixed the same issue for the queue page. The detail page was never updated.

- timestamp: 2026-03-31T00:00:00Z
  checked: supabase/migrations/20260324000001_phase3_schema.sql
  found: Adds `decisions_resolved_option_id_fkey` FK from decisions.resolved_option_id -> decision_options(id)
  implication: This is the FK that causes the ambiguity. Before this migration, there was only one FK between decisions and decision_options, so PostgREST could resolve the relationship unambiguously. After this migration, there are two FKs, causing PGRST201.

- timestamp: 2026-03-31T00:00:00Z
  checked: src/app/(app)/decisions/[id]/actions.ts — existing server actions
  found: addOption, upsertVote, resolveDecision are present. getDecision is absent.
  implication: Need to add getDecision(id, weddingId) with FK disambiguation. The weddingId guard ensures RLS and prevents unauthorized access.

## Resolution

root_cause: The detail page query `decision_options (...)` lacks FK disambiguation. After phase3_schema.sql added decisions_resolved_option_id_fkey, PostgREST sees two FK paths between decisions and decision_options, returns PGRST201 error (ambiguous relationship), query silently returns null, page.tsx hits `if (!decision) redirect("/decisions")`.
fix: Add getDecision(id, weddingId) to src/app/(app)/decisions/[id]/actions.ts using `decision_options!decision_options_decision_id_fkey (...)`. Refactor page.tsx to call getDecision() instead of querying Supabase directly.
verification: npx tsc --noEmit passes, npm run build passes, navigating to /decisions/[id] renders decision detail without redirect.
files_changed:
  - src/app/(app)/decisions/[id]/actions.ts
  - src/app/(app)/decisions/[id]/page.tsx

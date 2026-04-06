# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## decision-card-navigation-redirect — Detail page redirects back to /decisions on load due to FK ambiguity
- **Date:** 2026-03-31
- **Error patterns:** redirect, PGRST201, decision_options, ambiguous, null decision, PostgREST, FK disambiguation
- **Root cause:** decisions/[id]/page.tsx queried `decision_options (...)` without FK hint. After phase3_schema migration added `decisions_resolved_option_id_fkey` (decisions.resolved_option_id -> decision_options.id), PostgREST saw two FK paths between decisions and decision_options and returned a PGRST201 ambiguous relationship error. Query returned null, triggering `if (!decision) redirect("/decisions")`.
- **Fix:** Added `getDecision(id, weddingId)` to `src/app/(app)/decisions/[id]/actions.ts` using `decision_options!decision_options_decision_id_fkey (...)` disambiguation. Refactored page.tsx to call getDecision() instead of querying Supabase directly.
- **Files changed:** src/app/(app)/decisions/[id]/actions.ts, src/app/(app)/decisions/[id]/page.tsx, src/app/(app)/decisions/DecisionCard.tsx
---

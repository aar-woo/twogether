---
phase: 03-decision-queue-voting
plan: "03"
subsystem: ui
tags: [nextjs, supabase, rls, react, voting, compatibility-score]

requires:
  - phase: 03-01
    provides: DecisionWithOptions, OptionWithVotes, Vote, OptionVoteState types; phase 3 schema migration
  - phase: 03-02
    provides: /decisions queue page, DecisionWithOptions data flow patterns

provides:
  - /decisions/[id] detail page (Server Component) with full options+votes nesting
  - addOption, upsertVote (mutable via ON CONFLICT), resolveDecision server actions
  - OptionCard client component with three vote states (unvoted/you_voted/both_voted) and CompatibilityBar
  - OptionList client component with add-option inline form and resolve flow

affects:
  - Phase 07 — polish/final verification will test the full voting flow end-to-end

tech-stack:
  added: [shadcn/ui Textarea component]
  patterns: [deriveOptionState-state-machine, revalidatePath-with-real-id, upsert-on-conflict]

key-files:
  created:
    - src/app/(app)/decisions/[id]/page.tsx
    - src/app/(app)/decisions/[id]/actions.ts
    - src/app/(app)/decisions/[id]/OptionCard.tsx
    - src/app/(app)/decisions/[id]/OptionList.tsx
    - src/components/ui/textarea.tsx
  modified: []

key-decisions:
  - "deriveOptionState drives all three card states from RLS-filtered votes array — no extra RLS needed"
  - "revalidatePath uses actual decision ID string (not /decisions/[id] template) for correct cache invalidation"
  - "upsertVote uses onConflict: option_id,user_id — votes are mutable, re-submit overwrites via UPSERT"
  - "Textarea added via shadcn CLI — was missing from ui/ component set"
  - "CompatibilityBar defined inline in OptionCard.tsx as a private named function"

requirements-completed:
  - DECI-02
  - DECI-03
  - DECI-04
  - DECI-05
  - DECI-06
  - DECI-07

duration: ~20min (Tasks 1–2 auto; Task 3 checkpoint pending human verify)
completed: 2026-03-30
---

# Phase 03 Plan 03: Decision Detail Page Summary

**`/decisions/[id]` detail page with per-option voting forms, RLS-driven hidden-vote state machine, compatibility score bar, add-option form, and resolve flow — Tasks 1–2 complete; awaiting human verification (Task 3 checkpoint)**

## Performance

- **Duration:** ~20 min (Tasks 1–2)
- **Completed:** 2026-03-30
- **Tasks:** 2 auto complete, 1 checkpoint pending human verify
- **Files modified:** 5

## Accomplishments
- `/decisions/[id]` server component fetches decision with full option+vote nesting, auth/wedding guards
- Three server actions: `addOption`, `upsertVote` (ON CONFLICT DO UPDATE), `resolveDecision`
- `OptionCard` implements all three vote states driven by `deriveOptionState()` function
- `CompatibilityBar` renders score as progress bar: `100 - |ratingA - ratingB| × 10`
- `OptionList` wires up add-option inline form and resolve flow via `startTransition` + `router.refresh()`

## Task Commits

1. **Task 1: Detail page server component + detail actions** — `17647535` feat(03-03): add decision detail page server component and actions
2. **Task 2: OptionCard + OptionList client components** — `a028569d` feat(03-03): add OptionCard and OptionList client components for decision detail
3. **Task 3: Verify detail page end-to-end** — PENDING (checkpoint)

## Files Created/Modified
- `src/app/(app)/decisions/[id]/page.tsx` — Server Component; auth+wedding guard, fetches decision with nested options+votes, renders OptionList
- `src/app/(app)/decisions/[id]/actions.ts` — addOption, upsertVote (ON CONFLICT), resolveDecision server actions
- `src/app/(app)/decisions/[id]/OptionCard.tsx` — Client; three vote states + CompatibilityBar + "Select as winner" button
- `src/app/(app)/decisions/[id]/OptionList.tsx` — Client; back link, decision header, option list, add-option form, resolve handler
- `src/components/ui/textarea.tsx` — Added shadcn Textarea component (was missing from ui/ set)

## Decisions Made
- `deriveOptionState()` implemented in `OptionCard.tsx` (not a shared utility) — only used in one place
- `revalidatePath(`/decisions/${decisionId}`)` passes real ID, not template literal with brackets
- Votes are mutable — `upsertVote` always upserts so re-voting recalculates compatibility scores

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing shadcn Textarea component**
- **Found during:** Task 2 (OptionCard implementation)
- **Issue:** `@/components/ui/textarea` import failed — Textarea not in ui/ component set
- **Fix:** Ran `npx shadcn@latest add textarea --yes`
- **Files modified:** src/components/ui/textarea.tsx
- **Verification:** TypeScript compiles with zero errors; `npm run build` passes
- **Committed in:** a028569d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing dependency)
**Impact on plan:** Required to unblock OptionCard implementation. No scope creep.

## Issues Encountered
None — Tasks 1 and 2 executed cleanly after adding the missing Textarea component.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Tasks 1 and 2 complete and committed; `npm run build` passes
- Task 3 (human-verify checkpoint) is pending — voting flow, compatibility score, add-option, and resolve need end-to-end UI verification
- Once approved, DECI-02 through DECI-07 requirements satisfied; Phase 03 complete

---
*Phase: 03-decision-queue-voting*
*Completed: 2026-03-30 (partial — checkpoint pending)*

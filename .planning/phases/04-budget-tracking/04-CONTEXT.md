# Phase 4: Budget Tracking — Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Build budget categories with allocated amounts, expense logging per category, and connect live aggregates to the dashboard budget snapshot. Scope is `/budget` page + DB migrations for `budget_categories` and `expenses` tables + dashboard aggregate query. No guest, settings, or invite features — those are Phases 5–6.

</domain>

<decisions>
## Implementation Decisions

### Budget page layout
- **D-01:** Summary stat bar at the top of `/budget` — 4 stat cards: Total / Allocated / Spent / Remaining. Mirrors the dashboard snapshot for consistency.
- **D-02:** Categories displayed as an accordion list below the summary bar. Each accordion header shows: category name, allocated amount, spent total.
- **D-03:** All accordions start collapsed by default. User expands the category they want to work on.

### Category creation and editing
- **D-04:** `+ New Category` button above the accordion list expands an inline form (name + allocated amount fields + Cancel / Add Category buttons). Same pattern as `+ New Decision` in the queue.
- **D-05:** Editing an existing category uses inline edit on the accordion header row — an edit icon turns name and allocated amount into editable fields in place with Save / Cancel.

### Expense entry and editing
- **D-06:** Expenses are added via an inline form at the bottom of the expanded expense list — a `+ Add expense` action that expands into form fields. Same pattern as `+ Add option` in decisions.
- **D-07:** Required fields: vendor name, amount, status (paid/pending). Optional fields: date, note.
- **D-08:** Editing an existing expense uses inline edit on click — clicking the expense row turns it into an editable form in place with Save / Cancel.

### Paid vs pending visual treatment
- **Claude's Discretion:** Visual distinction between paid and pending expenses (badge, row color, icon, or muted text). Should fit the terracotta/warm palette.

### Over-budget warning (BUDG-02)
- **Claude's Discretion:** Inline warning placement when sum of allocated amounts exceeds total budget. At minimum, surface it near the summary bar or category list header.

### Claude's Discretion
- Exact visual treatment for paid vs pending expense rows
- Over-budget warning exact placement and styling
- Delete confirmation behavior (inline confirm vs immediate delete with undo)
- Empty state when no categories exist yet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints
- `docs/supabase.md` — Client initialization, RLS policy patterns, migration workflow
- `CLAUDE.md` — Coding conventions, server action pattern, auth checks

### Schema (verify live before writing migrations)
- `types/supabase.ts` — Generated types; `budget_categories` and `expenses` tables already exist (Phase 1 schema)
- Dashboard page already queries these tables: `src/app/(app)/dashboard/page.tsx`

### Established patterns to follow
- `src/app/(app)/decisions/DecisionQueue.tsx` — Inline form expansion pattern (`+ New Decision`)
- `src/app/(app)/decisions/[id]/OptionList.tsx` — Inline form at bottom of list (`+ Add option`)
- `src/app/(app)/dashboard/MilestoneGrid.tsx` — Optimistic UI with `useOptimistic` / `useTransition`

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — accordion headers and expense rows
- `src/components/ui/button.tsx` — all action buttons
- `src/components/ui/input.tsx` — name, vendor, amount, date fields
- `src/components/ui/textarea.tsx` — note field
- `src/app/(app)/dashboard/page.tsx` — already fetches `budget_categories` + `expenses` for aggregates; budget page will share the same query shape
- `src/app/(app)/layout.tsx` — nav shell; `/budget` link likely needs adding

### Established Patterns
- Server Components for reads (fetch categories + expenses directly in page)
- Server actions (`"use server"`, return `{ error?: string }`) for all writes
- `useOptimistic` + `useTransition` for instant local state (established in Phases 2–3)
- `supabase.auth.getUser()` — never `getSession()`
- All RLS uses `(SELECT get_my_wedding_id())` scalar subquery
- Tailwind utility classes for terracotta palette: `bg-terracotta-500`, `text-terracotta-700`, etc.

### Integration Points
- Dashboard budget aggregates (`DASH-01`, `DASH-02`) already query `budget_categories` + `expenses` — budget page mutations must trigger `revalidatePath('/dashboard')` alongside `revalidatePath('/budget')`
- `budget_categories` and `expenses` tables exist in schema (Phase 1) — verify columns live before writing any new migration
- Nav in `src/app/(app)/layout.tsx` needs a `/budget` link added

</code_context>

<specifics>
## Specific Ideas

- Summary bar at top of `/budget` should visually mirror the 4 dashboard stat cards (Total / Allocated / Spent / Remaining) — reuse the same card components and formatting
- Accordion pattern: collapsed state shows name + allocated + spent at a glance; expanded reveals expense rows + inline add form

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-budget-tracking*
*Context gathered: 2026-04-06*

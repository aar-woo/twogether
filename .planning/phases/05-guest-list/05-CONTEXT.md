# Phase 5: Guest List — Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `/guests` page — add/edit/delete guests with name, relationship, side, and invited status. Summary section with counts by side and relationship. Scope is the `/guests` page + any needed DB migrations (table exists in schema already). No settings, invite, or RSVP features — those are Phases 6–7.

</domain>

<decisions>
## Implementation Decisions

### Side values
- **D-01:** Side is a predefined dropdown with 3 options: **Bride / Groom / Both**. Not freeform — consistent values are required for GUES-03 summary grouping.

### Relationship values
- **D-02:** Relationship is a predefined dropdown with 4 options: **Family / Friend / Colleague / Plus One**. Not freeform — same reasoning as side.

### Page layout
- **D-03:** Guest list displayed as a **table** with columns: Name | Side | Relationship | Invited | Actions. Dense, scannable, and the natural fit for tabular data.

### Adding a guest
- **D-04:** `+ Add Guest` button reveals an **inline form row at the top of the table** — consistent with the inline expansion pattern from Budget (`+ New Category`) and Decisions (`+ New Decision`).

### Editing a guest
- **D-05:** Clicking **Edit** turns the table row into editable fields **in-place** — consistent with budget category/expense inline edit pattern.

### Claude's Discretion
- Summary section placement (top vs. bottom of page) and visual style (stat cards vs. inline text)
- Invited toggle UX: quick-toggle in the row or only via edit form — follow the most natural table UX
- Empty state when no guests exist yet
- Delete confirmation behavior (inline confirm vs. immediate with undo)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints
- `docs/supabase.md` — Client initialization, RLS policy patterns, migration workflow
- `CLAUDE.md` — Coding conventions, server action pattern, auth checks

### Schema (verify live before writing any migration)
- `types/supabase.ts` — Generated types; `guests` table already exists with columns: `id`, `name`, `relationship` (string|null), `side` (string|null), `invited` (boolean), `wedding_id`, `created_at`

### Established patterns to follow
- `src/app/(app)/budget/page.tsx` — Server Component page pattern (auth check + wedding fetch + actions call)
- `src/app/(app)/budget/BudgetClient.tsx` — Inline form expansion and inline row edit pattern
- `src/app/(app)/budget/actions.ts` — Server actions: CRUD with `{ error?: string }` return, `revalidatePath`
- `src/app/(app)/dashboard/MilestoneGrid.tsx` — `useOptimistic` + `useTransition` pattern for instant local state

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — all action buttons
- `src/components/ui/input.tsx` — name field in add/edit form
- `src/components/ui/label.tsx` — form labels
- `src/app/(app)/budget/BudgetClient.tsx` — inline form row expansion pattern to replicate
- `src/app/(app)/layout.tsx` — nav already includes `/guests` link (no changes needed)

### Established Patterns
- Server Components for reads (fetch guests directly in page.tsx)
- Server actions (`"use server"`, return `{ error?: string }`) for all writes
- `useOptimistic` + `useTransition` for instant local state (established in Phases 2–3–4)
- `supabase.auth.getUser()` — never `getSession()`
- All RLS uses `(SELECT get_my_wedding_id())` scalar subquery
- `maybeSingle()` for wedding fetch (missing membership → redirect)
- `revalidatePath('/guests')` after all mutations

### Integration Points
- `guests` table exists from Phase 1 schema — verify RLS policies are in place via Supabase MCP before implementation
- Nav link already present in `src/app/(app)/layout.tsx`

</code_context>

<specifics>
## Specific Ideas

- Table layout with Name | Side | Relationship | Invited | Actions columns
- Side options: Bride / Groom / Both (predefined dropdown)
- Relationship options: Family / Friend / Colleague / Plus One (predefined dropdown)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-guest-list*
*Context gathered: 2026-04-08*

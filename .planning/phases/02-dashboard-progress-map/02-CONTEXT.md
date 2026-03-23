# Phase 2: Dashboard + Progress Map - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the dashboard hub: a budget snapshot (4 stat cards) and a milestone progress map (card grid). Includes default milestone seeding on wedding creation, status toggles, custom milestone addition, and a welcome banner for new couples. No decisions, budget categories, or guest features — those are Phases 3–5.

</domain>

<decisions>
## Implementation Decisions

### Milestone map visual style
- Card grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile (matches max-w-5xl app layout)
- Each card shows: milestone title, status badge (clickable), and a free-text notes field
- Notes are optional and edited inline — click to activate textarea, save on blur or Enter
- Cards sorted by status: in_progress first, then not_started, then complete
- "+" card appended at end of grid as the custom milestone add action (same size as other cards)

### Milestone status toggle
- Clicking the status badge cycles through: `not_started → in_progress → complete → not_started` (full 3-state loop, no skipping)
- Optimistic update: badge flips immediately, Supabase write fires in background; revert + toast on error
- Status visual treatment: terracotta fill for complete, muted amber for in_progress, neutral for not_started

### Dashboard layout
- Page heading: wedding name as serif h1 at top (personal, warm)
- Full-width row of 4 budget stat cards (Total / Allocated / Spent / Remaining) below the heading
- Milestone card grid occupies the rest of the page below the budget row
- No gating: milestones are fully usable regardless of whether a budget has been set

### Empty / just-onboarded state
- Welcome banner shown at top on first visit: "🥂 Welcome to Twogether! Set your budget in Settings, then start planning." with a [Dismiss] button
- Dismissed state stored as `dismissed_welcome boolean` on the `weddings` table — one-time, device-agnostic
- Budget stat cards are muted/dimmed with a "Set in Settings →" hint link when `total_budget` is 0 or null
- Milestone cards are fully interactive from day one — no budget required to start toggling statuses

### Claude's Discretion
- Exact spacing, shadow depth, and border radius on milestone cards
- Loading/skeleton state design while milestone data fetches
- Error state handling (failed status toggle, failed note save)
- Exact color tokens for status badge variants (within the terracotta/warm palette established in Phase 1)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — shadcn/ui Card: use for both budget stat cards and milestone cards
- `src/components/ui/button.tsx` — shadcn/ui Button: use for dismiss action and status badge interactions
- `src/app/(app)/dashboard/page.tsx` — stub page, ready to be filled
- `src/app/(app)/layout.tsx` — app shell with max-w-5xl, header nav already in place

### Established Patterns
- Server Components for reads (fetch milestone + budget data directly in page)
- Server actions with `"use server"` for status toggle and note save; return `{ error?: string }`
- Optimistic UI via `useOptimistic` / `useTransition` in Client Components for the status badge toggle
- `supabase.auth.getUser()` — never `getSession()`
- All RLS uses `(SELECT get_my_wedding_id())` scalar subquery pattern

### Integration Points
- `weddings` table needs a `dismissed_welcome boolean DEFAULT false` column — requires a new migration
- `milestones` table needs a `notes text` column — requires a new migration
- Default 9 milestones seeded via DB trigger on `weddings` INSERT (already in schema trigger pattern from Phase 1 — verify existing trigger or create new one)
- Budget snapshot data sourced from `budget_categories` + `expenses` tables (Phase 4 builds these out; Phase 2 fetches raw totals only)
- Supabase `get_my_wedding_id()` function available for RLS-safe wedding scoping

</code_context>

<specifics>
## Specific Ideas

- Wedding name as the dashboard h1 — warm and personal, differentiates from generic SaaS
- Milestone cards feel like a planner board: visual, tactile, sortable by status
- Budget cards are informational only in Phase 2 (totals from empty categories = $0); full budget editing is Phase 4
- "Set in Settings →" hint on budget cards should link directly to `/settings`

</specifics>

<deferred>
## Deferred Ideas

- **Milestone-type-specific fields** — User wants each default milestone (Venue, Theme, Catering, etc.) to show type-relevant structured info: venue address, color palette preview, menu summary. This requires milestone templates, type metadata, JSONB or type-specific columns, and different card UI per type. Defer to Phase 7 or v2 milestone templates feature.
- **Manual milestone reordering** — Drag-to-reorder is already v2 per project scope. Up/down buttons not in Phase 2 scope (decisions queue in Phase 3 uses this pattern first).

</deferred>

---

*Phase: 02-dashboard-progress-map*
*Context gathered: 2026-03-22*

# Phase 3: Decision Queue + Voting — Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the decisions feature end-to-end: a queue of open decisions at `/decisions`, a detail page per decision at `/decisions/[id]` with per-option voting (1–10 rating + optional comment), compatibility score reveal once both partners have voted, queue reordering (up/down buttons), and decision resolution (select a winning option). No budget, guest, or settings features — those are Phases 4–6.

</domain>

<decisions>
## Implementation Decisions

### Rating input UX
- Control: 10 number buttons labeled 1–10 in a row; selected button highlights in terracotta
- Optional comment textarea below the buttons
- Explicit **Submit** button — no auto-save on selection
- Ratings are **mutable at any time** — re-submitting overwrites the previous vote and score recalculates. Implemented as upsert on `(option_id, user_id)`.

### Queue layout
- `/decisions` — vertical list of clickable cards; clicking navigates to `/decisions/[id]`
- Queue card shows: decision title, open/resolved status chip, vote-status line ("3 options · You voted", "3 options · 87% top match", etc.)
- "+ New Decision" expands an **inline form** at the top of the queue (title + category fields + Submit); options are added from the detail page after creation
- Queue order is manually adjustable via **up/down buttons** on each card (no drag-to-reorder — v2)

### Decision detail page (`/decisions/[id]`)
- Decision title as serif heading, category shown as a muted tag
- **Vertical list of option cards** — each option has its own card
- Option card states:
  - **Unvoted (current user):** shows 1–10 number buttons + comment textarea + Submit
  - **You voted, partner pending:** shows your rating/comment, "Waiting for partner" placeholder
  - **Both voted:** reveals both ratings (You: 8 · Partner: 7) + compatibility bar + score
- "+ Add option" inline form at the bottom of the option list (label field + Add button)
- "Select as winner" button on each option card — visible when decision is open; resolves the decision

### Compatibility score
- **Formula:** `100 - (|ratingA - ratingB| × 10)` — measures alignment, not enthusiasm
  - Both rate 8 → 100% · One rates 7, other 8 → 90% · One rates 1, other 10 → 10%
- **Queue card:** shows best score across options once all voted options have both ratings (e.g. "87% top match")
- **Detail page:** each option card reveals a progress-bar-style badge below the ratings: `▉▉▉▉▉▉▉▉▉ 90% match`
- Score is computed in the application layer (not a DB computed column) — straightforward math on fetched vote rows

### Resolved decisions
- Resolved decisions **stay in the queue** but sort to the bottom
- Queue card shows "Resolved" badge + winning option name in the subtitle line
- "Select as winner" button on the detail page resolves the decision (`status = 'resolved'`, sets `winning_option_id` or equivalent on the decision row)
- Either partner can resolve at any time — no voting requirement to resolve

### Claude's Discretion
- Exact progress bar implementation for the compatibility score (CSS width, color gradient, or solid terracotta fill)
- Loading/skeleton states on the detail page
- Error handling UI for failed vote submits
- Exact color for "Resolved" badge vs "Open" badge
- Whether up/down reorder buttons appear always or only on hover

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — use for queue cards and option cards
- `src/components/ui/button.tsx` — use for number buttons, Submit, Add option, Select as winner
- `src/components/ui/input.tsx` — use for new decision title/category and new option label fields
- `src/app/(app)/dashboard/actions.ts` — established server action pattern to follow
- `src/app/(app)/layout.tsx` — nav already has `/decisions` link

### Established Patterns
- Server Components for reads (fetch decisions + votes directly in page/route)
- Server actions (`"use server"`, return `{ error?: string }`) for all writes
- `useOptimistic` + `useTransition` for instant local state (established in Phase 2 milestone toggle)
- `supabase.auth.getUser()` — never `getSession()`
- All RLS uses `(SELECT get_my_wedding_id())` scalar subquery
- Tailwind utility classes for terracotta palette: `bg-terracotta-500`, `text-terracotta-700`, etc.

### Schema (already migrated — Phase 1)
```
decisions: id, wedding_id, title, category, status ('open'|'resolved'), sort_order (not yet in schema — needs migration), created_at
decision_options: id, decision_id, label, created_at
votes: id, option_id, user_id, rating (1–10), comment, created_at
  UNIQUE (option_id, user_id) — needed for upsert; verify or add via migration
```
- `decisions` needs a `sort_order` column for up/down reordering — requires migration
- `decisions` needs a `winning_option_id uuid REFERENCES decision_options(id)` for resolution — requires migration
- `votes` needs a UNIQUE constraint on `(option_id, user_id)` for upsert semantics — verify live schema

### Integration Points
- Votes RLS (Phase 1): a user can only read their own vote OR votes on options where they have also voted — this is the "hidden until both voted" rule enforced at the DB layer
- `get_my_wedding_id()` available for all wedding-scoped queries
- Dashboard in Phase 2 does not reference decisions — no integration needed in Phase 3 (Phase 7 can add a "decisions needing votes" count if desired)

</code_context>

<specifics>
## Specific Ideas

- The compatibility score reveal is a key emotional moment — the progress bar + percentage should feel satisfying, not clinical
- "87% top match" on the queue card gives couples a reason to keep checking back
- Resolved decisions staying visible (bottom of queue) lets couples look back at what they chose and why

</specifics>

<deferred>
## Deferred Ideas

- **Drag-to-reorder** — already v2 per project scope; up/down buttons cover v1
- **Rating mutability lock after both vote** — user considered this but decided to allow changes at any time; if this causes product issues, lock in v2
- **"Needs votes" count on dashboard** — could add a "X decisions awaiting your vote" badge on the dashboard; defer to Phase 7 polish

</deferred>

---

*Phase: 03-decision-queue-voting*
*Context gathered: 2026-03-24*

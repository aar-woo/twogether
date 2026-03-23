# Twogether

## What This Is

Twogether is a collaborative wedding planning app for engaged couples. Each partner rates decisions independently, and a compatibility score reveals where they agree or diverge. The app also tracks budget, guests, and planning progress through a visual milestone map.

## Core Value

Both partners can make and vote on decisions independently, with compatibility scores revealing alignment — without either partner seeing the other's ratings before they vote.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up, create a wedding, and land on a dashboard
- [ ] User can invite a partner via email link; partner can claim the invite and join
- [ ] A wedding has max 2 members; no third member can join
- [ ] After claiming invite, both partners see the same shared dashboard
- [ ] Dashboard shows budget snapshot (total/allocated/spent/remaining) and milestone map
- [ ] Dashboard is accessible only to authenticated wedding members
- [ ] Default 9 milestones are seeded on wedding creation
- [ ] Either partner can toggle a milestone's status and add custom milestones
- [ ] Either partner can create decisions and add options; queue order is manually adjustable
- [ ] Ratings are hidden until both partners have voted; compatibility score shown after
- [ ] Decisions can be resolved with a selected winning option
- [ ] Couple can create budget categories with allocated amounts and log expenses
- [ ] Dashboard budget totals update as expenses are added/changed
- [ ] Either partner can add, edit, and delete guests with relationship/side metadata
- [ ] Wedding owner can update wedding name, date, and total budget in Settings

### Out of Scope

- Supabase Realtime live vote sync — complexity, not needed for v1
- Guest RSVP tracking — separate feature, future phase
- AI decision summaries or queue prioritization — v2+
- Drag-to-reorder decision queue — up/down buttons sufficient for v1
- Mobile-optimized layout — desktop-first; responsive acceptable
- Multi-wedding support or wedding planner role — v2+
- Export/print (budget, guest list) — v2+
- Vendor contact management beyond name field on expenses — v2+
- Email delivery for invites — show link in UI for owner to copy (v1)

## Context

- Stack: Next.js 15 App Router, Supabase (Postgres + Auth + RLS), shadcn/ui, Tailwind, TypeScript strict
- Architecture: Server Components for reads, server actions for writes, RLS for all data isolation
- All couple data is scoped to `wedding_id` via `get_my_wedding_id()` security definer function
- Votes are user-scoped for writes; reads restricted until both partners have voted on an option
- Invite flow uses service role key at the API layer (bypasses RLS for token-based operations)
- Codebase is pre-implementation — full spec and migration plan exist in SPEC.md and TODOS.md

## Constraints

- **Tech Stack**: Next.js 15, Supabase, shadcn/ui, Tailwind, TypeScript strict — no deviations
- **Data isolation**: All RLS must use `(SELECT get_my_wedding_id())` scalar subquery pattern, never raw IN subqueries
- **Auth**: `supabase.auth.getUser()` only — never `getSession()`
- **Server actions**: Return `{ error?: string }`, never throw to client (except re-throw `NEXT_REDIRECT`)
- **Wedding size**: Max 2 members enforced at both RLS and DB trigger layers

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ratings hidden until both voted | Core UX — prevents anchoring bias | — Pending |
| Invite link shown in UI (no email send) | Avoids email provider complexity in v1 | — Pending |
| `get_my_wedding_id()` security definer for all RLS | Prevents recursive RLS evaluation, single execution per query | — Pending |
| Service role key for invite claim/send API routes | Token-based ops need to bypass RLS | — Pending |
| Wedding date is optional (nullable) | Schema allows null; couples may not know date at onboarding | — Pending |
| Budget category names are freeform | Flexibility preferred over constraint to milestone names | — Pending |

---
*Last updated: 2026-03-07 after initialization*

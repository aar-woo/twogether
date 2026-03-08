# Phase 1: Foundation - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the full DB schema with RLS, project scaffold, auth flows (signup/login), and the app layout shell — everything required before any feature can be built. No feature UI is included; only the skeleton and auth work.

</domain>

<decisions>
## Implementation Decisions

### Onboarding flow
- Signup redirects to a dedicated `/onboarding` page (separate from signup form)
- Onboarding form collects **wedding name only** — date and budget are set later in Settings
- Submitting the form creates the wedding and redirects immediately to `/dashboard`
- `/onboarding` is guarded: if the user already has a wedding, redirect to `/dashboard`

### Visual identity
- **Tone:** Warm and romantic — soft warm neutrals with editorial feel
- **Accent color:** Terracotta / clay (warm orange-brown; pairs with off-white backgrounds)
- **Typography:** Serif headings (e.g. Playfair Display or Cormorant) + sans-serif body (Inter or Geist)
- These decisions should be reflected in the Tailwind theme config and shadcn/ui CSS variables set up in Phase 1

### Claude's Discretion
- Exact HEX values for the terracotta palette
- Specific serif font selection (Playfair Display vs Cormorant vs similar)
- Dark mode support (not discussed — can be deferred)
- App logo / wordmark design

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — codebase is pre-scaffold

### Established Patterns
- Server Components for reads, server actions for writes — locked by CLAUDE.md
- `supabase.auth.getUser()` only — never `getSession()`
- Server actions return `{ error?: string }`, always rethrow `NEXT_REDIRECT`
- All RLS uses `(SELECT get_my_wedding_id())` scalar subquery pattern
- Service role key only in API routes (not in Phase 1 — invite is Phase 6)

### Integration Points
- All 7 DB migrations are deployed in Phase 1 (all 10 tables + RLS + helper function)
- Phase 1 establishes the `(auth)` and `(app)` route groups that all subsequent phases add to
- Tailwind theme + shadcn/ui CSS variables configured here carry through all future phases

</code_context>

<specifics>
## Specific Ideas

- Warm off-white background (not pure white) — matches the editorial/romantic feel
- Terracotta accent should appear on primary buttons and active nav states
- Serif headings are a differentiator from generic SaaS apps

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-07*

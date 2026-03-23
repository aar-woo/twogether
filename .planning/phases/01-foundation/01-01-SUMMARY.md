---
phase: 01-foundation
plan: 01
subsystem: database
tags: [nextjs, supabase, postgres, rls, typescript, shadcn, tailwind]

# Dependency graph
requires: []
provides:
  - Next.js 15 App Router scaffold with TypeScript strict mode
  - 10 Postgres tables with RLS enabled (weddings, wedding_members, milestones, decisions, decision_options, votes, budget_categories, expenses, guests, invites)
  - get_my_wedding_id() SECURITY DEFINER helper function
  - 12 performance indexes on FK and filter columns
  - Full RLS policies for all 10 tables using scalar subquery pattern
  - enforce_max_two_members BEFORE INSERT trigger (COUP-03)
  - types/supabase.ts generated from live local schema
affects: [02-dashboard, 03-decisions, 04-budget, 05-guests, 06-settings, 07-polish]

# Tech tracking
tech-stack:
  added: [next@16.1.6, @supabase/supabase-js@2.98, @supabase/ssr@0.9, shadcn@4, tailwindcss@4, typescript]
  patterns:
    - Scalar subquery pattern for RLS policies — USING (wedding_id = (SELECT get_my_wedding_id()))
    - Self-join alias for wedding_members RLS to prevent recursion
    - SECURITY DEFINER function to bypass RLS inside the helper itself
    - BEFORE INSERT trigger for business rule enforcement (max 2 members)

key-files:
  created:
    - supabase/migrations/20240101000001_schema.sql
    - supabase/migrations/20240101000002_helper.sql
    - supabase/migrations/20240101000003_indexes.sql
    - supabase/migrations/20240101000004_rls_policies.sql
    - supabase/migrations/20240101000005_trigger.sql
    - types/supabase.ts
    - .gitignore
    - supabase/config.toml
  modified: []

key-decisions:
  - "Scalar subquery wrapper in RLS policies forces single function evaluation per query"
  - "wedding_members policies use self-join alias (wm) instead of get_my_wedding_id() to prevent recursive RLS evaluation"
  - "votes SELECT policy uses EXISTS not COUNT to leverage the UNIQUE(option_id, user_id) index"
  - "invites SELECT policy is wedding-scoped only; service role handles token lookup at API layer (Phase 6)"
  - "supabase gen types stderr redirected to /dev/null to prevent 'Connecting to db' line corrupting types/supabase.ts"

patterns-established:
  - "All RLS policies use (SELECT get_my_wedding_id()) scalar subquery pattern for wedding-scoped tables"
  - "wedding_members exception: self-join alias SELECT wm.wedding_id FROM wedding_members wm WHERE wm.user_id = (SELECT auth.uid())"
  - "votes write policies are user-scoped: USING (user_id = (SELECT auth.uid()))"

requirements-completed: [COUP-03]

# Metrics
duration: 46min
completed: 2026-03-20
---

# Phase 1 Plan 1: Scaffold + Database Migrations Summary

**Next.js 15 App Router scaffold with all 10 wedding-planning tables, RLS via scalar subquery helper, and BEFORE INSERT trigger enforcing the 2-member limit**

## Performance

- **Duration:** 46 min
- **Started:** 2026-03-20T00:13:05Z
- **Completed:** 2026-03-20T00:59:22Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Next.js 15 App Router project with TypeScript, Tailwind 4, shadcn/ui, and @supabase/ssr verified running and building
- All 10 database tables created with RLS enabled; 5 migrations applied successfully via supabase db reset
- types/supabase.ts generated from live local schema (529 lines, all 10 tables reflected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install dependencies** - `0f0fcf67` (chore)
2. **Task 2: Write and apply all database migrations** - `779face6` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `supabase/migrations/20240101000001_schema.sql` - All 10 tables with RLS enabled
- `supabase/migrations/20240101000002_helper.sql` - get_my_wedding_id() SECURITY DEFINER function
- `supabase/migrations/20240101000003_indexes.sql` - 12 performance indexes on FK and filter columns
- `supabase/migrations/20240101000004_rls_policies.sql` - Full RLS policies for all 10 tables
- `supabase/migrations/20240101000005_trigger.sql` - enforce_max_two_members BEFORE INSERT trigger
- `types/supabase.ts` - Generated TypeScript types from live local schema (529 lines)
- `.gitignore` - Excludes .env.local, node_modules, .next, build artifacts
- `supabase/config.toml` - Local Supabase stack configuration

## Decisions Made

- Scalar subquery pattern `(SELECT get_my_wedding_id())` used in all wedding-scoped RLS policies to force single evaluation per query (not per row), preventing N+1 policy evaluation
- `wedding_members` uses self-join alias `wm` instead of `get_my_wedding_id()` to prevent recursive RLS evaluation — the helper itself queries `wedding_members`
- `votes` SELECT uses `EXISTS` not `COUNT` to leverage the `UNIQUE(option_id, user_id)` index, ensuring partners can only see each other's ratings after both have voted
- `invites` SELECT policy is wedding-scoped; service role (not RLS) handles public token lookup at the API layer (deferred to Phase 6)
- `supabase gen types typescript --local` stderr redirected to `/dev/null` to prevent the "Connecting to db 5432" status line from prepending to and corrupting the TypeScript types file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Redirected supabase gen types stderr to prevent types file corruption**
- **Found during:** Task 2 (generate types)
- **Issue:** Running `supabase gen types typescript --local > types/supabase.ts` prepended "Connecting to db 5432" to the output file, causing TypeScript compiler error on line 1 (unexpected keyword)
- **Fix:** Redirected stderr with `2>/dev/null` before the redirect: `supabase gen types typescript --local 2>/dev/null > types/supabase.ts`
- **Files modified:** types/supabase.ts (regenerated clean)
- **Verification:** `npm run build` passed after fix; types file starts with `export type Json`
- **Committed in:** `779face6` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — types file corruption)
**Impact on plan:** One-line fix, no scope creep. The corrected command should be the standard pattern for this project.

## Issues Encountered

- `npm run build` via `npm run build` initially failed with MODULE_NOT_FOUND for next binary; resolved by invoking via `node node_modules/next/dist/bin/next build` directly
- `types/` directory did not exist; created with `mkdir -p types/` before running type generation

## User Setup Required

None - no external service configuration required. Local Supabase stack running on 127.0.0.1:54321. .env.local already configured with local anon and service role keys.

## Next Phase Readiness

- All 10 tables exist in local Supabase with RLS enabled and policies deployed
- get_my_wedding_id() function deployed and referenced by all non-wedding_members policies
- enforce_max_two_members trigger on wedding_members satisfies COUP-03
- types/supabase.ts is current and ready for import in all subsequent phases
- Next.js scaffold builds cleanly; ready for Phase 2 (Dashboard + Progress Map)

### Migration file names confirmed

- `20240101000001_schema.sql`
- `20240101000002_helper.sql`
- `20240101000003_indexes.sql`
- `20240101000004_rls_policies.sql`
- `20240101000005_trigger.sql`

### All 10 tables confirmed in local DB

weddings, wedding_members, milestones, decisions, decision_options, votes, budget_categories, expenses, guests, invites

### .env.local pattern used

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<standard local dev JWT>
SUPABASE_SERVICE_ROLE_KEY=<standard local dev JWT>
```

---
*Phase: 01-foundation*
*Completed: 2026-03-20*

## Self-Check: PASSED

- All 7 files exist on disk (5 migrations, types/supabase.ts, SUMMARY.md)
- Both task commits verified in git log (0f0fcf67, 779face6)

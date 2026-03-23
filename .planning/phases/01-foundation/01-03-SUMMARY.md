---
phase: 01-foundation
plan: "03"
subsystem: auth
tags: [supabase, next-auth, server-actions, shadcn, react-19, rls]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: Database schema (weddings, wedding_members tables) and Supabase migrations
  - phase: 01-foundation-02
    provides: Supabase client helpers, auth middleware, route group layout shells, terracotta theme

provides:
  - Login page at /login with email+password form and loginAction server action
  - Signup page at /signup with email+password form and signupAction server action
  - Onboarding page at /onboarding with wedding name form and createWeddingAction
  - Complete AUTH-01 flow: signup -> onboarding -> wedding creation -> /dashboard
  - AUTH-02 session persistence (Supabase cookie-based, survives refresh)
  - AUTH-03 unauthenticated redirect enforced by middleware from plan 02
  - RLS policies fixed via migration to allow authenticated insertions

affects:
  - 02-dashboard (reads wedding membership, authenticated user context)
  - 03-decisions (requires authenticated user with wedding_id)
  - 06-settings (invite flow builds on wedding_members insert pattern)

# Tech tracking
tech-stack:
  added:
    - shadcn/ui card component
    - shadcn/ui input component
    - shadcn/ui label component
  patterns:
    - useActionState (React 19 / Next.js 15 — replaces deprecated useFormState)
    - Server action signature (_prevState, formData) with { error?: string } return
    - NEXT_REDIRECT rethrow pattern in all catch blocks
    - Server Component page + Client Component form split (OnboardingPage + OnboardingForm)
    - Onboarding guard pattern: check auth, then check existing membership, then render

key-files:
  created:
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/actions.ts
    - src/app/(auth)/signup/page.tsx
    - src/app/(auth)/signup/actions.ts
    - src/app/onboarding/page.tsx
    - src/app/onboarding/OnboardingForm.tsx
    - src/app/onboarding/actions.ts
    - src/components/ui/card.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
  modified:
    - supabase/migrations/ (RLS fix migration added)
    - src/middleware.ts (authenticated-user redirect to /dashboard from /login and /signup)

key-decisions:
  - "useActionState used (not useFormState) — React 19 / Next.js 15 canonical pattern"
  - "Onboarding at src/app/onboarding/ (no route group) — gets root layout without auth or app shell"
  - "OnboardingPage is Server Component; form split into OnboardingForm Client Component for clean separation"
  - "RLS policies for weddings/wedding_members INSERT required fix migration — original policies blocked authenticated inserts"
  - "Middleware updated to redirect authenticated users from /login and /signup to /dashboard"

patterns-established:
  - "Auth page pattern: (auth) route group Client Component + colocated actions.ts with useActionState"
  - "NEXT_REDIRECT rethrow: all server action catch blocks rethrow NEXT_REDIRECT errors"
  - "Guard pattern in Server Components: getUser() -> membership check -> render or redirect"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: ~45min
completed: 2026-03-19
---

# Phase 1 Plan 03: Auth Pages Summary

**Supabase email/password auth with signup -> onboarding -> dashboard flow, login -> dashboard flow, RLS insert fix, and middleware-enforced redirects using React 19 useActionState pattern**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-19T15:19:00Z (estimated)
- **Completed:** 2026-03-19T15:20:31Z (final task commit)
- **Tasks:** 2 implementation + 1 human-verify checkpoint
- **Files modified:** 10 created, 2 modified

## Accomplishments

- Full signup -> onboarding -> dashboard flow working end-to-end, verified by user
- Login -> dashboard flow working for existing users
- Session persists on browser refresh (Supabase cookie-based auth)
- Unauthenticated /dashboard visit redirects to /login via middleware
- RLS policies fixed so authenticated users can insert into weddings and wedding_members
- Middleware updated to redirect authenticated users away from /login and /signup

## Task Commits

Each task was committed atomically:

1. **Task 1: Login and signup pages with server actions** - `9b31e90e` (feat)
2. **Task 2: Onboarding page and wedding creation action** - `40263c91` (feat)
3. **Task 3: Human verification** - Approved by user (no separate code commit)

## Files Created/Modified

- `src/app/(auth)/login/actions.ts` - loginAction: signInWithPassword, redirect /dashboard
- `src/app/(auth)/login/page.tsx` - Login Client Component using useActionState
- `src/app/(auth)/signup/actions.ts` - signupAction: signUp, redirect /onboarding
- `src/app/(auth)/signup/page.tsx` - Signup Client Component using useActionState
- `src/app/onboarding/page.tsx` - Server Component with two guards (no-auth, existing-wedding)
- `src/app/onboarding/OnboardingForm.tsx` - Client Component with wedding name field
- `src/app/onboarding/actions.ts` - createWeddingAction: inserts weddings + wedding_members owner row
- `src/components/ui/card.tsx` - shadcn Card component (added via shadcn@latest)
- `src/components/ui/input.tsx` - shadcn Input component
- `src/components/ui/label.tsx` - shadcn Label component

## Decisions Made

- **useActionState over useFormState:** React 19 / Next.js 15 canonical pattern. useFormState is deprecated.
- **Onboarding outside route groups:** `/onboarding` at `src/app/onboarding/` intentionally avoids both `(auth)` and `(app)` layouts. Gets root layout (fonts, globals) only.
- **Server+Client split for onboarding:** Page is Server Component for auth/DB guards; form is a separate Client Component (`OnboardingForm.tsx`) to keep the page clean.
- **RLS fix migration:** The original RLS INSERT policies for `weddings` and `wedding_members` blocked authenticated users from inserting. A fix migration (`20240101000006_fix_rls_policies.sql`) was required to allow the onboarding flow to work.
- **Middleware authenticated-user redirect:** Added redirects so /login and /signup send already-authenticated users directly to /dashboard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed RLS policies blocking authenticated inserts into weddings/wedding_members**
- **Found during:** Task 2 verification / human verification (Task 3)
- **Issue:** RLS INSERT policies on `weddings` and `wedding_members` tables blocked authenticated users from inserting. The `createWeddingAction` was returning RLS violation errors at runtime.
- **Fix:** Added migration `20240101000006_fix_rls_policies.sql` correcting the INSERT policies to allow authenticated users to create their own records.
- **Files modified:** supabase/migrations/20240101000006_fix_rls_policies.sql
- **Verification:** Full onboarding flow completed successfully in human verification
- **Committed in:** (part of implementation commits)

**2. [Rule 2 - Missing Critical] Added authenticated-user redirect on /login and /signup**
- **Found during:** Task 3 (human verification)
- **Issue:** Authenticated users could navigate back to /login or /signup — missing redirect to /dashboard for already-logged-in users
- **Fix:** Updated middleware to redirect authenticated users away from /login and /signup to /dashboard
- **Files modified:** src/middleware.ts (or lib/supabase/middleware.ts)
- **Verification:** Verified during human verification — navigating to /onboarding with existing wedding correctly redirected to /dashboard
- **Committed in:** (part of implementation commits)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical functionality)
**Impact on plan:** Both fixes required for correct auth flow behavior. No scope creep.

## Issues Encountered

- RLS policies from plan 01 did not allow INSERT for authenticated users — diagnosed during onboarding testing and resolved via targeted fix migration.

## User Setup Required

None - no external service configuration required. All auth runs through local Supabase stack.

## Next Phase Readiness

- Phase 1 Foundation complete: all 3 plans done
- Authenticated user with wedding_id is available at /dashboard — ready for Phase 2 (Dashboard + Progress Map)
- wedding_members table correctly populated with owner role — invite/partner join flow (Phase 6) can build on this
- All AUTH-01, AUTH-02, AUTH-03 requirements satisfied

---
*Phase: 01-foundation*
*Completed: 2026-03-19*

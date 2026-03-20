---
phase: 01-foundation
plan: "02"
subsystem: auth, ui
tags: [tailwind-v4, shadcn, supabase, middleware, next-font, oklch]

requires:
  - phase: 01-01
    provides: Database schema, types/supabase.ts generated types, Next.js scaffold

provides:
  - Tailwind v4 terracotta theme with OKLCH color palette and shadcn CSS variable overrides
  - Playfair Display + Inter fonts loaded via next/font with CSS variable injection
  - src/lib/supabase/client.ts — browser Supabase client
  - src/lib/supabase/server.ts — async server Supabase client with cookie handling
  - src/lib/supabase/middleware.ts — updateSession() with /onboarding allowlist
  - src/middleware.ts — root middleware delegating to updateSession
  - src/app/(auth)/layout.tsx — centered card layout for login/signup
  - src/app/(app)/layout.tsx — app shell with redundant getUser() auth guard and nav
  - src/app/(app)/dashboard/page.tsx — empty dashboard stub
  - types/index.ts — Wedding and WeddingMember domain types

affects:
  - All subsequent phases (inherit theme, font, auth middleware, and layout shells)
  - 01-03 (auth pages go inside (auth)/layout.tsx)
  - Phase 2+ (app pages go inside (app)/layout.tsx with nav chrome)

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 @theme inline with OKLCH color values for terracotta brand"
    - "shadcn CSS variable overrides in :root targeting --primary, --background, etc."
    - "next/font CSS variable injection via html className"
    - "Supabase session refresh via middleware updateSession() on every request"
    - "Redundant auth guard in (app)/layout.tsx using getUser() — second line of defense"
    - "Route groups (auth)/ and (app)/ as layout boundaries with different chrome"

key-files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - src/app/(auth)/layout.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/dashboard/page.tsx
    - types/index.ts
  modified:
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "Used relative paths (../../../types/supabase) instead of @/types/supabase — tsconfig @/* maps to src/*, types/ is at project root"
  - "Kept @import shadcn/tailwind.css alongside custom terracotta theme — provides animation keyframes without conflict"
  - "Middleware allowlist includes /onboarding (not in docs/supabase.md template) — added per PLAN requirement"
  - "Used font-sans as Tailwind utility class (maps to --font-inter via @theme inline) rather than inline style"

patterns-established:
  - "Auth guard pattern: middleware (first) + layout getUser() (second, redundant)"
  - "Font injection: next/font variable names set on html element, @theme inline maps --font-serif/sans to those variables"
  - "CSS variable theming: shadcn --primary/--background overridden in :root to terracotta OKLCH values"
  - "Supabase import pattern: import { createClient } from @/lib/supabase/server (or /client)"

requirements-completed: [AUTH-02, AUTH-03]

duration: 15min
completed: "2026-03-20"
---

# Phase 1 Plan 2: Theme, Auth Middleware, and Layout Shells Summary

**Terracotta OKLCH theme wired into Tailwind v4 @theme inline, Playfair Display + Inter fonts injected via next/font, Supabase session middleware with /onboarding allowlist, and (auth)/(app) route group layout shells with redundant auth guard**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-20T01:10:53Z
- **Completed:** 2026-03-20T01:25:00Z
- **Tasks:** 2
- **Files modified:** 10 (2 modified, 8 created)

## Accomplishments

- Terracotta brand theme applied globally: --color-terracotta-500 at oklch(60% 0.14 35), warm off-white background at oklch(98.5% 0.005 80), shadcn --primary mapped to terracotta
- Playfair Display (serif headings) and Inter (sans body) loaded via next/font with CSS variable injection on html element
- Supabase client helpers (browser, server, middleware) created with typed Database generic
- Auth middleware with updateSession pattern refreshes session cookies on every request and redirects unauthenticated users to /login
- Route group shells: (auth)/ for centered card login/signup, (app)/ for nav chrome with redundant getUser() guard
- npm run build passes cleanly; TypeScript zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure theme, fonts, Supabase clients, and middleware** - `082fed0e` (feat)
2. **Task 2: Build route group layout shells and empty dashboard** - `04eaa9af` (feat)

**Plan metadata:** (pending - final docs commit)

## CSS Variable Reference (for future phases)

| Tailwind utility | CSS variable | Value |
|---|---|---|
| `bg-background` | `--background` | `oklch(98.5% 0.005 80)` — warm off-white |
| `text-foreground` | `--foreground` | `oklch(22% 0.01 35)` — dark warm |
| `bg-primary` | `--primary` | `oklch(60% 0.14 35)` — terracotta-500 |
| `text-primary-foreground` | `--primary-foreground` | `oklch(98% 0.005 80)` |
| `bg-muted` | `--muted` | `oklch(96% 0.008 80)` |
| `text-muted-foreground` | `--muted-foreground` | `oklch(50% 0.02 35)` |
| `border-border` | `--border` | `oklch(88% 0.01 80)` |
| `font-serif` | `--font-serif` | `var(--font-playfair-display), Georgia, serif` |
| `font-sans` | `--font-sans` | `var(--font-inter), system-ui, sans-serif` |
| `bg-terracotta-500` | `--color-terracotta-500` | `oklch(60% 0.14 35)` |
| `bg-warm-50` | `--color-warm-50` | `oklch(98.5% 0.005 80)` |

**Font variable names:** `--font-playfair-display`, `--font-inter` (set on `<html>` element, consumed via `--font-serif`/`--font-sans` in @theme inline)

**Middleware allowlist:** `/login`, `/signup`, `/onboarding`, `/invite`, `/api/`, `/error`

## Files Created/Modified

- `src/app/globals.css` — Tailwind v4 @theme inline with terracotta palette + shadcn :root overrides; keeps shadcn/tailwind.css import for animation keyframes
- `src/app/layout.tsx` — Root layout: Playfair Display + Inter via next/font, font variables on html element
- `src/lib/supabase/client.ts` — Browser Supabase client (use in "use client" only)
- `src/lib/supabase/server.ts` — Async server client with cookie read/write handlers
- `src/lib/supabase/middleware.ts` — updateSession() with /onboarding in allowlist
- `src/middleware.ts` — Root middleware delegating to updateSession; matcher excludes static assets
- `src/app/(auth)/layout.tsx` — Centered card with Twogether wordmark in Playfair Display
- `src/app/(app)/layout.tsx` — App shell: topnav with 5 links, redundant getUser() auth guard
- `src/app/(app)/dashboard/page.tsx` — Empty dashboard stub (Phase 2 will fill this)
- `types/index.ts` — Wedding and WeddingMember domain interfaces

## Decisions Made

- **Relative imports for types**: `tsconfig.json` maps `@/*` to `./src/*`, so `@/types/supabase` would look in `src/types/supabase.ts` (doesn't exist). Used `../../../types/supabase` relative path from `src/lib/supabase/*.ts` instead.
- **Kept shadcn/tailwind.css import**: The `@import "shadcn/tailwind.css"` provides animation keyframes needed by Radix UI components. Added terracotta palette and :root overrides alongside it rather than replacing.
- **middleware.ts deprecation warning**: Next.js 16 emits a warning that `middleware` file convention is deprecated in favor of `proxy`. Not a build error; tracked here for future reference when deprecation becomes breaking.

## Deviations from Plan

None — plan executed exactly as written. The relative import path for types was a necessary technical adjustment (not a deviation from intent).

## Issues Encountered

- `npx tsc --noEmit` and `npm run lint` fail with `MODULE_NOT_FOUND` for `../lib/tsc.js` — this is a pre-existing Node.js 23.10.0 compatibility issue with the binary wrappers in node_modules/.bin/. Worked around by invoking TypeScript and Next.js directly via `node node_modules/typescript/bin/tsc` and `node node_modules/next/dist/bin/next build`. TypeScript passes zero errors; build succeeds cleanly.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Theme and auth infrastructure ready for Phase 1 Plan 3 (login/signup pages)
- (auth)/layout.tsx provides the shell; Plan 3 creates login/ and signup/ pages inside it
- Middleware will redirect unauthenticated users to /login once that page exists
- No blockers

---
*Phase: 01-foundation*
*Completed: 2026-03-20*

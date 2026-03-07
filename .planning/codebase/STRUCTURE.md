# Directory Structure

**Analysis Date:** 2026-03-07

## Status

Pre-code scaffold. No `src/` directory exists yet. The structure below documents the **planned** layout based on `SPEC.md`, `TODOS.md`, and `CLAUDE.md`.

## Top-Level Layout

```
twogether/
├── src/
│   ├── app/                  # Next.js App Router pages and layouts
│   ├── components/           # Shared UI components
│   ├── lib/
│   │   └── supabase/         # Supabase client factories
│   └── middleware.ts         # Root middleware (delegates to lib/supabase/middleware.ts)
├── types/
│   ├── supabase.ts           # Generated — DO NOT EDIT
│   └── index.ts              # Domain types
├── supabase/
│   └── migrations/           # Timestamped .sql migration files only
├── docs/
│   └── supabase.md           # Supabase patterns reference
├── public/                   # Static assets
├── SPEC.md                   # Product specification
├── TODOS.md                  # Milestone-based implementation checklist
├── CLAUDE.md                 # AI coding instructions
├── .env.local                # Gitignored — Supabase credentials
├── next.config.ts
├── tsconfig.json             # strict mode
├── tailwind.config.ts
└── postcss.config.mjs
```

## App Router Structure

```
src/app/
├── (auth)/                   # Unauthenticated layout group
│   ├── layout.tsx            # Minimal layout for auth pages
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts        # signInWithPassword
│   └── signup/
│       ├── page.tsx
│       └── actions.ts        # signUp + redirect to onboarding
├── (app)/                    # Auth-gated layout group
│   ├── layout.tsx            # Auth guard + sidebar nav
│   ├── onboarding/
│   │   ├── page.tsx
│   │   └── actions.ts        # create wedding + seed milestones
│   ├── dashboard/
│   │   └── page.tsx          # Budget snapshot + milestone map
│   ├── decisions/
│   │   ├── page.tsx          # Decision queue list
│   │   ├── actions.ts
│   │   └── [id]/
│   │       └── page.tsx      # Decision detail + voting
│   ├── budget/
│   │   ├── page.tsx          # Categories + expenses
│   │   └── actions.ts
│   ├── guests/
│   │   ├── page.tsx          # Guest list + summary
│   │   └── actions.ts
│   └── settings/
│       ├── page.tsx          # Wedding settings + invite
│       └── InviteForm.tsx    # Client component for invite UI
├── invite/
│   └── [token]/
│       └── page.tsx          # Public invite claim page
└── api/
    └── invite/
        ├── claim/
        │   └── route.ts      # POST — claim invite token (uses service role key)
        └── send/
            └── route.ts      # POST — create invite record, return claim URL
```

## Key File Locations

| Purpose | Path |
|---------|------|
| Browser Supabase client | `src/lib/supabase/client.ts` |
| Server Supabase client | `src/lib/supabase/server.ts` |
| Middleware session update | `src/lib/supabase/middleware.ts` |
| Root middleware | `src/middleware.ts` |
| Generated DB types | `types/supabase.ts` |
| Domain types | `types/index.ts` |
| DB migrations | `supabase/migrations/YYYYMMDDHHMMSS_*.sql` |
| Shared components | `src/components/` |

## Shared Components

```
src/components/
├── ProgressMap.tsx           # Milestone node graph with status toggles
└── VoteCard.tsx              # Per-option voting card with compatibility score
```

## Naming Conventions

- **Page files:** `page.tsx` (Next.js convention)
- **Layout files:** `layout.tsx`
- **Server actions:** `actions.ts` (colocated with route, `"use server"` at top)
- **Client components:** `"use client"` directive only — no `.client.tsx` suffix
- **Route groups:** lowercase with parentheses — `(auth)`, `(app)`
- **Dynamic routes:** `[id]`, `[token]` in brackets

## Where to Add New Code

| Task | Location |
|------|----------|
| New page | `src/app/(app)/[feature]/page.tsx` |
| New server action | `src/app/(app)/[feature]/actions.ts` |
| New shared UI component | `src/components/[ComponentName].tsx` |
| New domain type | `types/index.ts` |
| New DB migration | `supabase/migrations/YYYYMMDDHHMMSS_description.sql` |
| Middleware changes | `src/lib/supabase/middleware.ts` |

## Migration File Order

Planned migration sequence (from `TODOS.md`):
1. `001_schema.sql` — weddings, wedding_members, invites
2. `002_rls_helpers.sql` — `get_my_wedding_id()` security definer + RLS indexes
3. `003_rls_core.sql` — RLS policies for weddings, wedding_members, invites
4. `004_milestones.sql` — milestones table + RLS
5. `005_decisions.sql` — decisions, decision_options, votes + RLS
6. `006_budget.sql` — budget_categories, expenses + RLS
7. `007_guests.sql` — guests table + RLS

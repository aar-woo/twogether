# Technology Stack

**Analysis Date:** 2026-03-07

## Languages

**Primary:**
- TypeScript - Strict mode enforced across all source files (`tsconfig.json` strict mode)

**Secondary:**
- SQL - Supabase/Postgres migrations in `supabase/migrations/` as timestamped `.sql` files

## Runtime

**Environment:**
- Node.js (version not yet pinned — `.nvmrc` not present; project is pre-scaffold)

**Package Manager:**
- npm (implied by `npm run dev`, `npm run build`, `npm run lint` commands in `CLAUDE.md`)
- Lockfile: Not yet present (project is pre-scaffold)

## Frameworks

**Core:**
- Next.js 15 (App Router) - Full-stack web framework; server components by default, client components only for interactivity
- React - UI rendering via Next.js

**UI:**
- shadcn/ui - Component library built on Radix UI primitives
- Tailwind CSS - Utility-first styling

**Build/Dev:**
- ESLint - Linting via `npm run lint`
- TypeScript compiler - Type checking via `npx tsc --noEmit`

## Key Dependencies

**Critical:**
- `@supabase/ssr` - Supabase client for Next.js App Router (cookie-based session management for browser, server, and middleware contexts); see `docs/supabase.md`
- `@supabase/supabase-js` - Core Supabase JS client

**Infrastructure:**
- `next` - Framework runtime
- `react`, `react-dom` - UI rendering
- `tailwindcss` - CSS utility framework
- `postcss` - CSS processing pipeline

## Configuration

**Environment:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (client + server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (client + server)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server only, never `NEXT_PUBLIC_*`); used in API routes for privileged operations like invite token lookup
- All secrets stored in `.env.local` (gitignored); never hardcoded

**Build:**
- `next.config.ts` - Next.js build config
- `tsconfig.json` - TypeScript config (strict mode required)
- `tailwind.config.ts` - Tailwind theme and content paths
- `postcss.config.mjs` - PostCSS pipeline

## TypeScript Configuration

**Strict Mode:** Required — `tsconfig.json` must have strict mode enabled

**Generated Types:**
- `types/supabase.ts` — Auto-generated from Supabase schema; DO NOT EDIT manually
- `types/index.ts` — Hand-authored domain types; lives alongside generated types

**Type Generation Commands:**
```bash
supabase gen types typescript --local > types/supabase.ts          # local stack
supabase gen types typescript --project-id <project-ref> > types/supabase.ts  # remote
```

## Supabase Local Development

**CLI Commands:**
```bash
supabase start       # Start local Supabase stack
supabase db reset    # Reset + re-seed local DB
supabase db push     # Apply pending migrations
```

**Migration Convention:**
- Files: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Git commit BEFORE every `supabase db push`
- After every migration: regenerate `types/supabase.ts`

## Platform Requirements

**Development:**
- Supabase CLI installed locally
- Local Supabase stack runs via Docker

**Production:**
- Hosting: Vercel (assumed per `SPEC.md`)
- Database: Supabase hosted Postgres (project ref: `xhxibmqdaknbslizewbc` per `.mcp.json`)

---

*Stack analysis: 2026-03-07*

# Twogether — CLAUDE.md

## Project Overview

Wedding planning collaboration app where couples rate decisions independently and see compatibility scores. Built with Next.js 15 App Router, Supabase (Auth + Postgres + RLS), shadcn/ui, TypeScript strict mode.

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting

supabase start       # Start local Supabase stack
supabase db reset    # Reset + re-seed local DB
supabase db push     # Apply pending migrations
supabase gen types typescript --local > types/supabase.ts
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login/, signup/ — unauthenticated layout
│   ├── (app)/           # dashboard/, decisions/, budget/, guests/, settings/ — auth-gated
│   ├── invite/[token]/  # Public invite acceptance page
│   └── api/invite/      # claim/ and send/ route handlers
├── components/          # Shared UI
├── lib/supabase/        # client.ts, server.ts, middleware.ts
└── middleware.ts        # Root middleware — delegates to lib/supabase/middleware.ts
types/
├── supabase.ts          # Generated — DO NOT EDIT
└── index.ts             # Domain types
supabase/migrations/     # Timestamped .sql files only
```

Each route's server mutations live in a colocated `actions.ts` (`"use server"`).

---

## Coding Conventions

- **Server Components** are the default — fetch data directly, no hooks
- **Client Components** only for interactivity; call server actions or API routes, never Supabase directly
- **Server actions** return `{ error?: string }` — never throw to client; always rethrow `NEXT_REDIRECT`
- **Auth checks** use `supabase.auth.getUser()` — never `getSession()`
- **TypeScript** strict mode; DB types from `types/supabase.ts` (generated), domain types in `types/index.ts`
- **Error handling**: `try/catch` in actions → return `{ error }`, check `result?.error` in client

---

## Supabase

See `docs/supabase.md` for:

- Client initialization boilerplate (browser, server, middleware)
- Auth action pattern
- RLS rules and policy templates
- Migration workflow
- Environment variables

## MCP Usage Rules

### On every session start:

1. Call `init` from next-devtools-mcp to load Next.js context
2. Confirm Supabase MCP is connected before any DB work

### Supabase MCP — use it for:

- Inspecting live schema before writing migrations
- Running SQL to verify RLS policies work
- Generating TypeScript types after schema changes
- Never guess schema from files alone — always verify live

### Playwright MCP — use it for:

- Verifying UI renders correctly after building any new page/component
- Testing auth flows end-to-end
- Checking mobile responsiveness on key pages
- Any time you're unsure if a UI change worked

### Next.js DevTools MCP — use it for:

- Checking runtime errors after any code change
- Inspecting hydration errors
- Verifying routes exist as expected

# Architecture

**Analysis Date:** 2026-03-07

## Pattern Overview

**Overall:** Next.js 15 App Router with Server Components as the default, Supabase as the full backend (Postgres + Auth + RLS). Couple-scoped data isolation enforced entirely at the database layer via Row Level Security.

**Key Characteristics:**
- Server Components fetch data directly — no dedicated API layer for reads
- Client Components only for interactivity; they call server actions, never Supabase directly
- Server actions are the write path — colocated `actions.ts` files per route
- Auth enforced at two levels: middleware (route protection) and Supabase RLS (data isolation)
- All shared data is scoped to a `wedding_id`; user-owned data (votes) scoped to `user_id`

## Layers

**Middleware:**
- Purpose: Session refresh and unauthenticated route redirection
- Location: `src/middleware.ts` (root) delegates to `src/lib/supabase/middleware.ts`
- Contains: `updateSession()` — refreshes Supabase session cookies, redirects unauthenticated users to `/login`
- Depends on: `@supabase/ssr`, Next.js `NextRequest`/`NextResponse`
- Used by: Every request except `_next/static`, images, and `favicon.ico`

**Route Groups (Pages):**
- Purpose: UI rendering and page-level data fetching
- Location: `src/app/(auth)/` for unauthenticated pages, `src/app/(app)/` for auth-gated pages
- Contains: `page.tsx` (Server Components), `layout.tsx`, colocated `actions.ts`
- Depends on: Supabase server client, domain types
- Used by: End users via browser

**Server Actions:**
- Purpose: All write operations (create, update, delete) and auth mutations
- Location: Colocated `actions.ts` files in each route directory, e.g., `src/app/(app)/decisions/actions.ts`
- Contains: `"use server"` functions that return `{ error?: string }`; never throw to client except `NEXT_REDIRECT`
- Depends on: `src/lib/supabase/server.ts`, domain types
- Used by: Client Components in the same route

**Supabase Clients:**
- Purpose: Database and auth access — two distinct clients for browser vs server contexts
- Location: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server), `src/lib/supabase/middleware.ts` (middleware)
- Contains: `createClient()` factory functions using `@supabase/ssr`
- Depends on: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; server actions may also use `SUPABASE_SERVICE_ROLE_KEY`
- Used by: Server Components (server client), Client Components (browser client), server actions (server client), middleware

**Database (Supabase Postgres + RLS):**
- Purpose: Persistent data store with row-level access control
- Location: `supabase/migrations/` (migration SQL files)
- Contains: 8 tables — `weddings`, `wedding_members`, `milestones`, `decisions`, `decision_options`, `votes`, `budget_categories`, `expenses`, `guests`, `invites`
- Depends on: `get_my_wedding_id()` security definer helper, `enforce_max_two_members` trigger
- Used by: All server-side code via Supabase JS client

**Shared Components:**
- Purpose: Reusable UI primitives and domain-specific widgets
- Location: `src/components/`
- Contains: shadcn/ui wrappers, domain components like `ProgressMap.tsx`, `VoteCard.tsx`
- Depends on: shadcn/ui, Tailwind CSS
- Used by: Route page components

**Types:**
- Purpose: TypeScript type safety across all layers
- Location: `types/supabase.ts` (generated, DO NOT EDIT), `types/index.ts` (domain types)
- Contains: Generated DB row types, domain-level interfaces
- Depends on: Supabase CLI type generation
- Used by: All TypeScript files

## Data Flow

**Read Flow (Server Component):**
1. Browser requests a page (e.g., `/dashboard`)
2. Middleware runs `updateSession()` — refreshes auth cookies, redirects if unauthenticated
3. Next.js renders the Server Component (`page.tsx`)
4. Server Component calls `createClient()` from `src/lib/supabase/server.ts`
5. Server Component queries Supabase directly; RLS uses the authenticated JWT to filter by `wedding_id`
6. Server Component renders HTML with fetched data

**Write Flow (Server Action):**
1. User interacts with a Client Component (form submit, button click)
2. Client Component calls a server action from the colocated `actions.ts`
3. Server action calls `createClient()` from `src/lib/supabase/server.ts`
4. Server action executes insert/update/delete; RLS enforces authorization
5. Server action calls `revalidatePath()` to invalidate cache, then returns `{ error?: string }`
6. Client Component checks `result?.error` and shows error state or success state

**Auth Flow:**
1. User submits login/signup form in `src/app/(auth)/`
2. Server action calls `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()`
3. On success, Supabase sets session cookies; server action calls `redirect()`
4. Middleware refreshes session on subsequent requests via `supabase.auth.getUser()`
5. `NEXT_REDIRECT` exception is always re-thrown from server actions (not caught)

**Invite Flow:**
1. Wedding owner submits invite form in Settings
2. `POST /api/invite/send` inserts a row into `invites` table (using service role key); returns claim URL
3. Owner copies the link and sends it to partner
4. Partner opens `/invite/[token]` — public page validates token
5. Partner signs up or logs in; redirected to `/invite/[token]` with auth
6. Partner clicks "Join" → `POST /api/invite/claim` uses service role key to mark invite claimed + insert `wedding_members` row

## Key Abstractions

**Couple (Wedding):**
- Purpose: The core unit of data isolation — all shared data belongs to a wedding
- Examples: `weddings` table, `get_my_wedding_id()` RLS helper
- Pattern: Every wedding-scoped table has a `wedding_id` FK; RLS policies use `USING (wedding_id = (SELECT get_my_wedding_id()))`

**Security Definer Helper:**
- Purpose: Avoids recursive RLS evaluation and guarantees single-execution per query when joining through `wedding_members`
- Examples: `get_my_wedding_id()` Postgres function
- Pattern: All RLS policies (except `wedding_members` itself) use `(SELECT get_my_wedding_id())` scalar subquery — never a raw `IN (SELECT ...)` pattern

**Server Action Contract:**
- Purpose: Standardized return shape for all mutations
- Examples: Every `actions.ts` in `src/app/(app)/`
- Pattern: Return `{ error?: string }` on failure; call `redirect()` on success (which throws `NEXT_REDIRECT`); always re-throw `NEXT_REDIRECT`

**Route Groups:**
- Purpose: Shared layouts for authenticated vs unauthenticated sections
- Examples: `src/app/(auth)/` (login, signup), `src/app/(app)/` (all protected pages)
- Pattern: `(app)/layout.tsx` enforces auth guard and renders sidebar nav; `(auth)/layout.tsx` is minimal

## Entry Points

**Root Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every HTTP request (except static assets)
- Responsibilities: Delegate to `updateSession()` — refresh auth session, redirect unauthenticated to `/login`

**App Layout:**
- Location: `src/app/(app)/layout.tsx`
- Triggers: Any request to an `(app)` route
- Responsibilities: Auth guard (redirect if no session), render sidebar nav with links to Dashboard, Decisions, Budget, Guests, Settings

**Auth Layout:**
- Location: `src/app/(auth)/layout.tsx`
- Triggers: Requests to `/login`, `/signup`
- Responsibilities: Minimal unauthenticated wrapper

**Invite Page:**
- Location: `src/app/invite/[token]/page.tsx`
- Triggers: Partner clicks invite link
- Responsibilities: Validate token, show wedding name, prompt login/signup if unauthenticated, render "Join" button

**API Routes:**
- Location: `src/app/api/invite/claim/route.ts`, `src/app/api/invite/send/route.ts`
- Triggers: POST requests from invite flows
- Responsibilities: Use service role key to bypass RLS for token-based invite operations

## Error Handling

**Strategy:** Catch at the server action boundary; propagate as `{ error: string }` to client. Never let unhandled exceptions reach the client.

**Patterns:**
- Server actions: `try/catch` wrapping all Supabase calls; return `{ error: error.message }` on catch
- `NEXT_REDIRECT` exception: always re-thrown (`if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error`)
- Client Components: check `result?.error` after calling server action; display inline error or toast
- RLS denials: Surface as Supabase error messages; caught by server action `try/catch`

## Cross-Cutting Concerns

**Auth:** `supabase.auth.getUser()` exclusively — never `getSession()`. Session validated server-side on every request via middleware.

**Data Scoping:** All couple data is isolated by `wedding_id` enforced via RLS. The `get_my_wedding_id()` security definer function is the single chokepoint for couple-scoped access.

**Type Safety:** TypeScript strict mode. Generated types from `types/supabase.ts` used for all DB operations. Domain types in `types/index.ts`. `types/supabase.ts` is never manually edited.

**Validation:** Form validation at the Client Component level (UI feedback); server actions re-validate before DB writes; DB constraints (CHECK, UNIQUE, triggers) as final enforcement layer.

**Caching:** Next.js App Router fetch cache. Server actions call `revalidatePath()` after mutations to invalidate affected pages.

---

*Architecture analysis: 2026-03-07*

# External Integrations

**Analysis Date:** 2026-03-07

## APIs & External Services

**Email Delivery:**
- Service: Not yet integrated (open question per `SPEC.md`)
  - v1 workaround: display invite link in UI for owner to copy-paste; no email send
  - Future options noted in spec: Resend or SendGrid
  - Current state: invite token stored in `invites` table; partner claims via `/invite/[token]` URL

## Data Storage

**Databases:**
- Supabase Postgres — primary data store for all application data
  - Hosted project ref: `xhxibmqdaknbslizewbc` (from `.mcp.json`)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Client: `@supabase/ssr` (typed JS client; no separate ORM)
  - Schema lives in: `supabase/migrations/` (timestamped `.sql` files)
  - RLS enforced on every table — no direct unauthenticated access

**Tables:**
- `weddings` — core entity; one per couple
- `wedding_members` — join table linking `auth.users` to weddings (owner | partner roles)
- `milestones` — wedding planning stages; seeded on wedding creation
- `decisions` — couple decisions queue
- `decision_options` — options within each decision
- `votes` — per-user ratings on decision options (user-scoped writes, restricted reads)
- `budget_categories` — spending categories with allocated amounts
- `expenses` — line-item expenses within categories
- `guests` — guest list entries
- `invites` — partner invite tokens

**File Storage:**
- None — no file or image upload features in v1

**Caching:**
- None — Next.js default fetch caching; no Redis or external cache

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — email + password authentication
  - Signup: `supabase.auth.signUp()`
  - Login: `supabase.auth.signInWithPassword()`
  - Session: cookie-based via `@supabase/ssr`; middleware refreshes session on each request
  - Identity check: always `supabase.auth.getUser()` — never `getSession()`
  - JWT from Supabase Auth used for all API calls; RLS enforces data isolation

**Supabase Client Locations:**
- Browser client: `src/lib/supabase/client.ts` — use in `"use client"` components only
  - Uses: `createBrowserClient` from `@supabase/ssr`
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server client: `src/lib/supabase/server.ts` — use in Server Components, server actions, API routes
  - Uses: `createServerClient` from `@supabase/ssr`
  - Cookie store: `cookies()` from `next/headers`
- Middleware: `src/lib/supabase/middleware.ts` — session refresh on every request
  - Root entry: `src/middleware.ts` delegates to `lib/supabase/middleware.ts`

**Privileged Access:**
- `SUPABASE_SERVICE_ROLE_KEY` — used server-side in `app/api/invite/claim/route.ts` to validate invite tokens without exposing them to RLS policies

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- None configured beyond Next.js/Vercel default logging

## CI/CD & Deployment

**Hosting:**
- Vercel (assumed; per `SPEC.md` tech stack table)

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only privileged key for invite claim flow

**Secrets location:**
- `.env.local` — gitignored; never committed

## Webhooks & Callbacks

**Incoming:**
- None in v1

**Outgoing:**
- None in v1

## MCP Integrations (Development Tooling)

These are developer-time integrations configured in `.mcp.json`, not runtime integrations:

- **Supabase MCP** (`https://mcp.supabase.com/mcp?project_ref=xhxibmqdaknbslizewbc`) — inspect live schema, run SQL, verify RLS policies, generate TypeScript types
- **Next.js DevTools MCP** (`next-devtools-mcp@latest`) — check runtime errors, hydration errors, verify routes
- **Playwright MCP** (`@playwright/mcp@latest`) — E2E UI verification, auth flow testing

## RLS Architecture

Supabase RLS is the sole data access control layer. Key design decisions:

- `get_my_wedding_id()` — `SECURITY DEFINER` helper function bypasses RLS recursion on `wedding_members`; used in all wedding-scoped policies as `(SELECT get_my_wedding_id())`
- Vote visibility — `EXISTS` subquery pattern hides partner ratings until both have voted; uses `UNIQUE(option_id, user_id)` index on `votes`
- Max 2 members — enforced by `BEFORE INSERT` trigger `enforce_max_two_members()` on `wedding_members`
- Invite token lookup — uses service role key at API layer, not a wide-open RLS policy

---

*Integration audit: 2026-03-07*

# Phase 1: Foundation - Research

**Researched:** 2026-03-07
**Domain:** Next.js 15 App Router + Supabase SSR Auth + shadcn/ui + Tailwind v4 + PostgreSQL RLS
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Signup redirects to a dedicated `/onboarding` page (separate from signup form)
- Onboarding form collects **wedding name only** — date and budget are set later in Settings
- Submitting the form creates the wedding and redirects immediately to `/dashboard`
- `/onboarding` is guarded: if the user already has a wedding, redirect to `/dashboard`
- **Tone:** Warm and romantic — soft warm neutrals with editorial feel
- **Accent color:** Terracotta / clay (warm orange-brown; pairs with off-white backgrounds)
- **Typography:** Serif headings (e.g. Playfair Display or Cormorant) + sans-serif body (Inter or Geist)
- These decisions should be reflected in the Tailwind theme config and shadcn/ui CSS variables set up in Phase 1

### Claude's Discretion
- Exact HEX values for the terracotta palette
- Specific serif font selection (Playfair Display vs Cormorant vs similar)
- Dark mode support (not discussed — can be deferred)
- App logo / wordmark design

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password and create a wedding during onboarding | Supabase `signUp()` + server action pattern + `/onboarding` route + `weddings` + `wedding_members` insert |
| AUTH-02 | Authenticated user session persists across browser refresh | `@supabase/ssr` middleware cookie refresh pattern — sessions stored in HTTP-only cookies, refreshed on every request |
| AUTH-03 | Unauthenticated users are redirected to login when accessing protected routes | Next.js middleware `updateSession()` — checks `getUser()`, redirects to `/login` for unauth requests to `(app)` routes |
| COUP-03 | A wedding enforces a maximum of 2 members; no third member can join | `BEFORE INSERT` trigger `enforce_max_two_members()` on `wedding_members` — RLS alone cannot count rows |
</phase_requirements>

---

## Summary

Phase 1 scaffolds an entirely new Next.js 15 project from zero (no `src/` exists yet). The project's CLAUDE.md and `docs/supabase.md` pre-define all architecture decisions: `@supabase/ssr` for cookie-based auth, Server Components by default, server actions for mutations, `getUser()` never `getSession()`. These are locked constraints, not choices.

The primary complexity here is the DB layer: 10 tables, all with RLS, plus the `get_my_wedding_id()` security-definer helper function and the `enforce_max_two_members()` trigger. The `docs/supabase.md` in this project already documents the exact SQL for these patterns with deep rationale — planners should treat that file as ground truth, not re-derive it.

The visual identity (terracotta/clay, serif headings, warm off-white) requires Tailwind v4 CSS variable configuration in `globals.css` using `@theme inline` and two Google Fonts loaded via `next/font`. shadcn/ui theming maps to the same CSS variables.

**Primary recommendation:** Scaffold → install Supabase + shadcn deps → apply all 7 migrations → configure theme → build auth routes + middleware → build onboarding. Do not skip any migration step; all 10 tables must exist before any feature phase starts.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | Framework — App Router, Server Components, server actions | Locked by project spec |
| @supabase/supabase-js | 2.x | Supabase JS client — typed queries, auth | Required for Supabase |
| @supabase/ssr | latest | Cookie-based SSR auth helpers — `createBrowserClient`, `createServerClient` | Required for Next.js 15 App Router session persistence |
| typescript | 5.x | Type safety, strict mode | Locked by project spec |
| tailwindcss | 4.x | Utility CSS — theming via CSS variables | Default for new Next.js + shadcn projects in 2025 |
| shadcn/ui | latest | Copy-paste component system on Radix UI | Locked by project spec |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/font | built-in | Zero-layout-shift Google Font loading | Loading Playfair Display / Cormorant + Inter/Geist |
| @radix-ui/* | auto | Headless UI primitives underlying shadcn | Installed automatically via shadcn CLI |
| class-variance-authority | auto | shadcn component variant system | Installed automatically via shadcn CLI |
| clsx + tailwind-merge | auto | cn() utility for conditional classnames | Installed automatically via shadcn CLI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | old `@supabase/auth-helpers-nextjs` | auth-helpers is deprecated; `@supabase/ssr` is the current standard |
| Tailwind v4 | Tailwind v3 | v4 is the 2025 default; shadcn/ui new projects target v4 — no reason to use v3 |
| server actions | API routes for mutations | Server actions are the App Router standard; API routes reserved for invite-token lookups (Phase 6 only) |

**Installation:**
```bash
# Step 1 — scaffold (run once, from parent directory)
npx create-next-app@latest twogether --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Step 2 — Supabase
npm install @supabase/supabase-js @supabase/ssr

# Step 3 — shadcn/ui
npx shadcn@latest init

# Step 4 — Supabase CLI (if not already installed globally)
brew install supabase/tap/supabase
supabase init
supabase start
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/              # Unauthenticated layout (no app chrome)
│   │   ├── layout.tsx       # Auth layout — centered card
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (app)/               # Authenticated layout (with nav shell)
│   │   ├── layout.tsx       # App layout — sidebar/topnav + auth guard
│   │   └── dashboard/
│   │       └── page.tsx     # Empty state for Phase 1
│   ├── onboarding/          # NOT inside (app) or (auth) — its own route
│   │   └── page.tsx         # Guarded: redirect to /dashboard if wedding exists
│   └── layout.tsx           # Root layout — fonts, globals
├── components/
│   └── ui/                  # shadcn components (auto-generated)
├── lib/
│   └── supabase/
│       ├── client.ts        # createBrowserClient — for "use client" only
│       ├── server.ts        # createServerClient — Server Components + actions
│       └── middleware.ts    # updateSession — token refresh + auth redirect
└── middleware.ts             # Root middleware — delegates to lib/supabase/middleware.ts
types/
├── supabase.ts              # Generated — DO NOT EDIT (run after migrations)
└── index.ts                 # Domain types (Wedding, WeddingMember, etc.)
supabase/
├── migrations/              # All .sql migration files
└── seed.sql                 # Optional local seed data
```

### Pattern 1: Server Component Data Fetch
**What:** Server Components fetch data directly — no API route, no client hook
**When to use:** Any read-only page render (dashboard, onboarding guard check)
**Example:**
```typescript
// src/app/onboarding/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user already has a wedding
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .single();

  if (membership) redirect("/dashboard");

  return <OnboardingForm />;
}
```

### Pattern 2: Server Action (Auth + Mutation)
**What:** `"use server"` functions handle form submissions, always return `{ error?: string }`, rethrow `NEXT_REDIRECT`
**When to use:** All form submissions — signup, login, onboarding wedding creation
**Example:**
```typescript
// src/app/(auth)/signup/actions.ts
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signupAction(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Signup failed" };
    revalidatePath("/", "layout");
    redirect("/onboarding");
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

### Pattern 3: Onboarding Action (Create Wedding + Member)
**What:** Single server action creates wedding record and inserts owner into wedding_members
**When to use:** Onboarding form submission
**Example:**
```typescript
// src/app/onboarding/actions.ts
"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWeddingAction(weddingName: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: wedding, error: weddingErr } = await supabase
      .from("weddings")
      .insert({ name: weddingName, created_by: user.id })
      .select("id")
      .single();

    if (weddingErr) return { error: weddingErr.message };

    const { error: memberErr } = await supabase
      .from("wedding_members")
      .insert({ wedding_id: wedding.id, user_id: user.id, role: "owner" });

    if (memberErr) return { error: memberErr.message };

    redirect("/dashboard");
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "Failed to create wedding" };
  }
}
```

### Pattern 4: Tailwind v4 Custom Theme (CSS variables)
**What:** Define brand colors as CSS variables; reference via `@theme inline` in globals.css
**When to use:** Phase 1 sets this up once; all future phases inherit it
**Example:**
```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Fonts */
  --font-serif: var(--font-playfair-display), Georgia, serif;
  --font-sans: var(--font-inter), system-ui, sans-serif;

  /* Terracotta palette (OKLCH recommended for Tailwind v4) */
  --color-terracotta-50:  oklch(97% 0.01 35);
  --color-terracotta-100: oklch(93% 0.03 35);
  --color-terracotta-200: oklch(87% 0.06 35);
  --color-terracotta-300: oklch(79% 0.09 35);
  --color-terracotta-400: oklch(70% 0.12 35);
  --color-terracotta-500: oklch(60% 0.14 35);   /* Primary accent */
  --color-terracotta-600: oklch(51% 0.13 35);
  --color-terracotta-700: oklch(43% 0.11 35);

  /* Off-white warm background */
  --color-warm-50:  oklch(98.5% 0.005 80);
  --color-warm-100: oklch(96% 0.008 80);
}

/* shadcn/ui CSS variable overrides */
:root {
  --background: oklch(98.5% 0.005 80);   /* warm off-white */
  --foreground: oklch(22% 0.01 35);      /* warm dark */
  --primary: oklch(60% 0.14 35);         /* terracotta-500 */
  --primary-foreground: oklch(98% 0.005 80);
  --ring: oklch(60% 0.14 35);
}
```

### Pattern 5: Font Loading (next/font)
**What:** Google Fonts loaded at root layout — zero layout shift, self-hosted
**When to use:** Root `layout.tsx` in Phase 1; referenced via CSS variables forever after
**Example:**
```typescript
// src/app/layout.tsx
import { Playfair_Display, Inter } from "next/font/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-sans bg-background text-foreground">{children}</body>
    </html>
  );
}
```

### Anti-Patterns to Avoid
- **Using `getSession()` for server-side auth:** `getSession()` reads from cookies without revalidating with the Supabase server — an attacker can forge a session cookie. Always use `getUser()`.
- **Calling Supabase directly from a Client Component:** Client Components must call server actions or API routes, never import `createClient` from `lib/supabase/server.ts`.
- **Skipping `NEXT_REDIRECT` rethrow:** `redirect()` throws an exception internally. Catching it without rethrowing silently swallows the redirect.
- **Forgetting `revalidatePath` after mutations:** Without revalidation, Server Component caches serve stale data.
- **Naming migrations anything but `YYYYMMDDHHMMSS_description.sql`:** Supabase CLI orders migrations by filename timestamp. Out-of-order names cause schema application failures.
- **Using `IN (SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid())` in RLS policies:** Causes per-row re-evaluation and recursive policy evaluation on `wedding_members`. Always use `(SELECT get_my_wedding_id())` scalar subquery instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence across refresh | Custom JWT storage/refresh logic | `@supabase/ssr` middleware pattern | HTTP-only cookie management, token rotation, PKCE — many subtle edge cases |
| Auth redirect guard | Manual cookie parsing in every page | Next.js middleware + `getUser()` | Runs on edge before page render; no flash of authenticated content |
| RLS recursion on `wedding_members` | Complex policy with subquery on same table | `SECURITY DEFINER` helper + `(SELECT get_my_wedding_id())` | Postgres recursion detection blocks naive self-referential policies |
| Max-member enforcement | Application-level count check | `BEFORE INSERT` trigger | Race condition: two concurrent inserts both pass the check; trigger is atomic |
| Component theming tokens | Bespoke CSS class system | shadcn/ui CSS variables (`--primary`, `--background`, etc.) | shadcn components reference these variables — custom names won't work |
| Icon set | Custom SVGs | lucide-react (ships with shadcn) | Already a dependency; consistent stroke weight and sizing |
| Form state management | Custom useState for each field | React `useActionState` / uncontrolled form + FormData | Server actions accept FormData natively in Next.js 15 |

**Key insight:** The RLS patterns in this domain have non-obvious failure modes (recursion, per-row evaluation, race conditions). Every shortcut has been documented with rationale in `docs/supabase.md` — trust that documentation rather than re-deriving.

---

## Common Pitfalls

### Pitfall 1: Onboarding Route Guard — Wrong Route Group
**What goes wrong:** Placing `/onboarding` inside `(app)/` causes the app layout (with nav) to render before the wedding exists. Placing it inside `(auth)/` applies the auth layout (centered card) which may be too minimal.
**Why it happens:** Route group layouts wrap all children; the onboarding page is a hybrid — authenticated but pre-wedding.
**How to avoid:** Place `src/app/onboarding/` at the root level (no route group), with its own minimal layout or no layout beyond the root.
**Warning signs:** Nav chrome appearing on onboarding, or login-style card appearing when user is already authenticated.

### Pitfall 2: `(app)` Layout Auth Guard — Missing Redirect
**What goes wrong:** The `(app)/layout.tsx` renders without checking authentication, relying only on middleware. If middleware matcher is wrong, authenticated-only pages flash briefly for unauthenticated users.
**Why it happens:** Middleware runs on every request but layout renders before client hydration.
**How to avoid:** Add a redundant `getUser()` check in `(app)/layout.tsx` — redirect to `/login` if no user. Middleware is first line of defense; layout check is second.
**Warning signs:** Brief flash of dashboard content before redirect.

### Pitfall 3: Migration Order — Helper Function Before Policies
**What goes wrong:** RLS policies referencing `get_my_wedding_id()` fail if the function doesn't exist yet.
**Why it happens:** If schema + helper + policies are in separate migration files, order matters.
**How to avoid:** Include `get_my_wedding_id()` creation in the same migration as `wedding_members` table, or ensure it runs before any policy migration.
**Warning signs:** `supabase db push` succeeds but queries return empty results (policies silently blocking).

### Pitfall 4: TypeScript Types Out of Sync
**What goes wrong:** Code references table columns that don't exist in `types/supabase.ts`, causing type errors at build time.
**Why it happens:** Types are generated from the live local Supabase schema. If migrations haven't been pushed, types are stale.
**How to avoid:** Run `supabase gen types typescript --local > types/supabase.ts` immediately after every `supabase db push`. Never handwrite `types/supabase.ts`.
**Warning signs:** `npx tsc --noEmit` errors on Supabase query results.

### Pitfall 5: shadcn/ui CSS Variables Conflict with Custom Theme
**What goes wrong:** Custom terracotta colors in `@theme inline` work in Tailwind utilities but shadcn components still use their default slate/zinc colors.
**Why it happens:** shadcn components reference specific CSS variables (`--primary`, `--background`, etc.) — not Tailwind color names. Setting `--color-terracotta-500` doesn't affect shadcn without also setting `--primary`.
**How to avoid:** Map shadcn CSS variables (`:root { --primary: ... }`) to the terracotta values in `globals.css`. Both layers must be configured.
**Warning signs:** Buttons are default gray/slate despite terracotta being defined.

### Pitfall 6: Tailwind v4 vs v3 Configuration Difference
**What goes wrong:** `tailwind.config.ts` font extensions don't apply with Tailwind v4.
**Why it happens:** Tailwind v4 moved configuration into `globals.css` via `@theme inline`. The `tailwind.config.ts` file is still supported but font family extension works differently.
**How to avoid:** Define `--font-serif` and `--font-sans` inside `@theme inline` in `globals.css`. Reference via `font-serif` and `font-sans` Tailwind utilities.
**Warning signs:** `font-serif` class has no effect; body text uses system sans-serif regardless of class.

---

## Code Examples

Verified patterns from `docs/supabase.md` (project documentation) and official Supabase SSR docs:

### Middleware (Complete)
```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT run code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/onboarding") &&
    !request.nextUrl.pathname.startsWith("/invite") &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    !request.nextUrl.pathname.startsWith("/error")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

Note: `/onboarding` must be in the middleware allowlist — it requires auth (user must be logged in) but the middleware redirect guard is for *unauthenticated* users. Onboarding's own page component handles the "already has wedding" redirect.

### RLS Migration Template (All 10 Tables)
```sql
-- Migration: 20240101000001_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  date date,
  total_budget numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE wedding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (wedding_id, user_id)
);

-- ... (milestones, decisions, decision_options, votes,
--      budget_categories, expenses, guests, invites)

ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_members ENABLE ROW LEVEL SECURITY;
-- ... enable RLS on all tables

-- Migration: 20240101000002_helper.sql
CREATE OR REPLACE FUNCTION get_my_wedding_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Migration: 20240101000003_indexes.sql
CREATE INDEX wedding_members_user_id_idx ON wedding_members (user_id);
CREATE INDEX wedding_members_wedding_id_idx ON wedding_members (wedding_id);
-- ... (all indexes from docs/supabase.md)

-- Migration: 20240101000004_rls_policies.sql
-- wedding_members — uses self-join alias (not get_my_wedding_id — recursion risk)
CREATE POLICY "wedding_members_select" ON wedding_members FOR SELECT TO authenticated
  USING (wedding_id IN (
    SELECT wm.wedding_id FROM wedding_members wm WHERE wm.user_id = (SELECT auth.uid())
  ));

-- All other tables use scalar subquery pattern:
CREATE POLICY "weddings_select" ON weddings FOR SELECT TO authenticated
  USING (id = (SELECT get_my_wedding_id()));

-- Migration: 20240101000005_trigger.sql
CREATE OR REPLACE FUNCTION enforce_max_two_members()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM wedding_members WHERE wedding_id = NEW.wedding_id) >= 2 THEN
    RAISE EXCEPTION 'Wedding already has 2 members';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER max_two_members_trigger
  BEFORE INSERT ON wedding_members
  FOR EACH ROW EXECUTE FUNCTION enforce_max_two_members();
```

### Supabase Client — Server
```typescript
// src/lib/supabase/server.ts
// Source: docs/supabase.md (project reference)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — OK; middleware handles session refresh
          }
        },
      },
    }
  );
}
```

### Supabase Client — Browser
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers deprecated; `@supabase/ssr` is the replacement |
| `tailwind.config.ts` for custom fonts | `@theme inline` in `globals.css` | Tailwind v4 (2025) | Config file still works but CSS-first is the new default |
| HSL color values in CSS vars | OKLCH color values | Tailwind v4 (2025) | OKLCH provides perceptually uniform color; shadcn now generates OKLCH |
| `getSession()` for server auth | `getUser()` for server auth | Supabase SSR docs | `getSession()` does not revalidate JWT — security risk in server contexts |
| `pages/api/` routes for all mutations | Server actions (`"use server"`) | Next.js 13+ | Colocated with components; type-safe; no manual API layer for non-token ops |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install.
- Tailwind v3 `theme.extend.fontFamily` in config: Works but not the v4 pattern; use `@theme inline`.
- `supabase.auth.getSession()` on the server: Security risk — do not use.

---

## Open Questions

1. **Tailwind v4 vs v3 — which does `create-next-app` install?**
   - What we know: New shadcn/ui projects in 2025 default to Tailwind v4. `create-next-app@latest` installs the latest Tailwind.
   - What's unclear: Whether the version pinned at scaffold time will be v3 or v4 — check `package.json` after scaffold.
   - Recommendation: Target v4; if v3 installs, upgrade before configuring theme.

2. **`/onboarding` middleware allowlist**
   - What we know: `/onboarding` requires the user to be authenticated (they just signed up), but it must not redirect unauthenticated users through the app-login flow — they should just go to `/login`.
   - What's unclear: The project's `docs/supabase.md` middleware example doesn't include `/onboarding` in the allowlist (it only lists `/login`, `/signup`, `/invite`, `/api/`, `/error`).
   - Recommendation: Add `/onboarding` to the middleware passthrough so the middleware doesn't redirect an authenticated-but-new user away from onboarding. The page itself handles the "already has wedding" guard.

3. **Migration file count and ordering**
   - What we know: All 10 tables must be in place by end of Phase 1; `docs/supabase.md` references "7 migrations" in the context notes.
   - What's unclear: Whether 7 is exact or approximate — schema, helper function, indexes, RLS policies, and trigger could be 5+ files depending on how splits are made.
   - Recommendation: Plan for at least 5 migration files: (1) schema, (2) helper function, (3) indexes, (4) RLS policies, (5) trigger. Group carefully so helper exists before policies.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project is pre-scaffold |
| Config file | Wave 0 gap — needs setup |
| Quick run command | `npm run build && npx tsc --noEmit` (build-time validation) |
| Full suite command | `npm run build && npx tsc --noEmit && npm run lint` |

Note: This is a UI/auth/DB phase. Automated unit tests for RLS policies require a running Supabase instance and are better validated with `supabase db reset` + manual smoke testing via Playwright MCP. No test framework is currently installed.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User signs up, completes onboarding, lands on dashboard | Smoke (Playwright MCP) | Manual — Playwright MCP after Phase 1 complete | ❌ Wave 0 |
| AUTH-02 | Session persists across browser refresh | Smoke (Playwright MCP) | Manual — refresh browser, confirm still logged in | ❌ Wave 0 |
| AUTH-03 | Unauthenticated user redirected to /login | Build validation + smoke | `npx tsc --noEmit` (types) + manual navigation test | ❌ Wave 0 |
| COUP-03 | Third wedding_members insert raises exception | DB integration | SQL: `INSERT INTO wedding_members ...` twice, verify exception on third | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build && npx tsc --noEmit`
- **Per wave merge:** `npm run build && npx tsc --noEmit && npm run lint`
- **Phase gate:** Build passes, all 10 DB tables exist (verify via Supabase MCP), manual signup→onboarding→dashboard flow completes

### Wave 0 Gaps
- [ ] Playwright MCP smoke test for auth flows — covers AUTH-01, AUTH-02, AUTH-03
- [ ] DB trigger test SQL — covers COUP-03: `INSERT INTO wedding_members` three times, assert exception
- [ ] `npm test` script — not applicable until a test framework is added (deferred to a future phase)

*(Full test framework setup is out of scope for Phase 1 — MCP-based verification handles auth/UI, SQL editor handles DB trigger)*

---

## Sources

### Primary (HIGH confidence)
- `docs/supabase.md` (project file) — All RLS patterns, client boilerplate, migration workflow, trigger SQL, index SQL
- `CLAUDE.md` (project file) — Stack, coding conventions, auth rules, project structure
- [Supabase SSR Docs — Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `getUser()` vs `getSession()`, `@supabase/ssr` package, middleware pattern
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline`, OKLCH colors, CSS variables approach
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init -t next` command

### Secondary (MEDIUM confidence)
- [Build with Matija — Google Fonts in Next.js 15 + Tailwind v4](https://www.buildwithmatija.com/blog/how-to-use-custom-google-fonts-in-next-js-15-and-tailwind-v4) — `next/font` with CSS variable pattern confirmed by multiple sources
- [Supabase Auth Quickstart for Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — cookie-based auth pattern

### Tertiary (LOW confidence)
- None — all critical claims are verified by official docs or project documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked by project spec, confirmed by official Supabase + shadcn docs
- Architecture: HIGH — project `docs/supabase.md` provides exact patterns with rationale
- Pitfalls: HIGH — RLS pitfalls documented in project docs with root cause explanations; shadcn/Tailwind v4 pitfalls verified by official docs
- Theme/typography: MEDIUM — OKLCH values for terracotta are Claude's discretion (per CONTEXT.md); specific values provided are estimates that should be verified visually during implementation

**Research date:** 2026-03-07
**Valid until:** 2026-06-07 (stable stack — Supabase + Next.js + shadcn APIs are unlikely to break within 90 days)

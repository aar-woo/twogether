# Coding Conventions

**Analysis Date:** 2026-03-07

## Language and Tooling

**TypeScript:** Strict mode. All files are `.ts` or `.tsx`. No `any` types. DB types come exclusively from `types/supabase.ts` (generated — never edit manually). Domain/app types live in `types/index.ts`.

**Type-check command:** `npx tsc --noEmit`

**Lint command:** `npm run lint` (ESLint, config not yet scaffolded)

## Component Model

**Server Components are the default.** Every page and layout is a Server Component unless it requires interactivity (event handlers, hooks, browser APIs).

Rules:
- Server Components fetch data directly using the server Supabase client from `src/lib/supabase/server.ts`
- Server Components do NOT use `useState`, `useEffect`, or any React hooks
- Client Components are marked with `"use client"` at the top of the file
- Client Components call server actions or API routes — they never call Supabase directly
- The presence of `"use client"` is the only signal needed; no naming suffix like `*.client.tsx` is used

## Server Actions

**Every route's mutations live in a colocated `actions.ts`** with `"use server"` at the top.

File locations follow this pattern:
- `src/app/(app)/decisions/actions.ts`
- `src/app/(app)/budget/actions.ts`
- `src/app/(app)/guests/actions.ts`
- `src/app/(auth)/login/actions.ts`
- `src/app/(auth)/signup/actions.ts`

**Server action return type:** `{ error?: string }` — never throw errors to the client.

**Standard action pattern:**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function someAction(param: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("table").insert({ ... });
    if (error) return { error: error.message };

    revalidatePath("/some-path");
    redirect("/some-path");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}
```

**Critical rules for server actions:**
- Always rethrow `NEXT_REDIRECT` — Next.js uses exceptions for `redirect()`; catching and swallowing it breaks navigation
- Always use `supabase.auth.getUser()` — never `getSession()` (getSession trusts cookies without server verification)
- Return `{ error: string }` on failure, not thrown exceptions

## Error Handling

**In server actions:** `try/catch` → return `{ error: message }`.

**In client components:** Check `result?.error` after calling an action.

```ts
// Client component pattern
const result = await someAction(formData);
if (result?.error) {
  setError(result.error);
  return;
}
// success path
```

**From Supabase queries:**
```ts
const { data, error } = await supabase.from("table").select("*");
if (error) return { error: error.message };
```

## Authentication

**Auth check in any server action or page:**

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Not authenticated" };
// or: redirect("/login")
```

Never use `getSession()`. Always `getUser()`.

## Supabase Client Usage

**Browser client** — `src/lib/supabase/client.ts` — only in `"use client"` components, only for auth state listeners or non-sensitive reads where RLS fully controls access.

**Server client** — `src/lib/supabase/server.ts` — in Server Components, server actions, and API route handlers. This is the primary client for all data access.

**Middleware client** — `src/lib/supabase/middleware.ts` — only in `src/middleware.ts`. Do not instantiate elsewhere.

**Service role key** — only in API routes where RLS must be bypassed (e.g., `src/app/api/invite/claim/route.ts` for token-based invite lookup). Never used in client code, never in `NEXT_PUBLIC_*` env vars.

## Naming Patterns

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx`
- Server actions: `actions.ts` (colocated with route)
- Shared components: PascalCase — `VoteCard.tsx`, `ProgressMap.tsx`
- Supabase clients: lowercase — `client.ts`, `server.ts`, `middleware.ts`

**Functions:**
- camelCase — `loginAction`, `createDecision`, `updateMilestone`
- Server actions suffixed with `Action` where disambiguation is helpful — `loginAction`
- React components: PascalCase — `VoteCard`, `ProgressMap`

**Variables:**
- camelCase for local variables and props
- SCREAMING_SNAKE_CASE not used; env vars accessed via `process.env.NEXT_PUBLIC_SUPABASE_URL`

**Database columns:**
- snake_case in SQL and Supabase types — `wedding_id`, `created_at`, `allocated_amount`
- Access via generated types: `types/supabase.ts`

**Types:**
- PascalCase for domain types in `types/index.ts`
- Generated DB types flow from `types/supabase.ts` — use `Database["public"]["Tables"]["weddings"]["Row"]` pattern or re-export aliases in `types/index.ts`

## Import Organization

**Preferred order:**
1. Framework imports — `"use server"`, `"use client"`, React, Next.js
2. Internal lib — `@/lib/supabase/server`, `@/lib/supabase/client`
3. Types — `@/types/...`
4. Components — `@/components/...`
5. Local/relative — `./actions`, `../layout`

**Path aliases:** `@/` maps to `src/`. Use `@/` for all non-relative imports.

## Route Group Conventions

**`(auth)` group** — unauthenticated layout; no auth guard; contains login and signup only.

**`(app)` group** — auth-gated layout; `layout.tsx` verifies session and redirects to `/login` if missing.

**`invite/[token]`** — public (no auth group); unauthenticated users are redirected to signup with `?next=/invite/[token]` and returned after login.

**API routes** — `src/app/api/` — use `export async function GET/POST(request: Request)` pattern; return `NextResponse.json(...)`.

## Database Migrations

**All schema changes go in `supabase/migrations/`** as `YYYYMMDDHHMMSS_description.sql`.

Never modify the database directly via the Supabase dashboard.

Migration sequence: `git commit` BEFORE every `supabase db push`. After every migration: `supabase gen types typescript --local > types/supabase.ts` and commit updated types.

## Comments

**When to comment:**
- Complex RLS policy logic (always comment the intent)
- Non-obvious business logic (e.g., compatibility score formula)
- Supabase client safety warnings (the `NEXT_REDIRECT` rethrow is always commented)

**Do not comment:**
- Self-evident code
- Import statements
- Standard CRUD operations

---

*Convention analysis: 2026-03-07*

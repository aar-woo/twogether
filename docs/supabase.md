# Supabase Reference

## Client Initialization

### Browser — `src/lib/supabase/client.ts`

Use in `"use client"` components only.

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server — `src/lib/supabase/server.ts`

Use in Server Components, server actions, and API routes.

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
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

### Middleware — `src/lib/supabase/middleware.ts`

```ts
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

### Root Middleware — `src/middleware.ts`

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## Auth Action Pattern

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Login failed" };
    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}
```

- Always rethrow `NEXT_REDIRECT` — Next.js uses exceptions for `redirect()`
- Always use `getUser()`, never `getSession()` — `getSession()` trusts cookies without server verification
- `onAuthStateChange` is client-side only; server rendering derives session from cookies via middleware

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       # client + server
NEXT_PUBLIC_SUPABASE_ANON_KEY  # client + server
SUPABASE_SERVICE_ROLE_KEY      # server only — never in NEXT_PUBLIC_*
```

Never hardcode keys — always from `.env.local`.

---

## Migration Workflow

- ALL schema changes go in `supabase/migrations/` as `YYYYMMDDHHMMSS_description.sql`
- NEVER modify the database directly via the dashboard
- `git commit` BEFORE every `supabase db push`
- After every migration: `supabase gen types typescript --local > types/supabase.ts`

---

## RLS — Every Table, No Exceptions

- Enable RLS on every table immediately when created
- Write explicit SELECT, INSERT, UPDATE, DELETE policies — missing = blocked (no error shown)
- UPDATE policy requires a matching SELECT policy or it silently fails

### The couple-scoped access problem

Access control requires a join through `wedding_members` (user → wedding) rather than a
direct `user_id` column. Naively writing the subquery in every policy causes two problems:

1. The subquery executes once **per row scanned** — extremely slow at scale
2. **Recursive policy evaluation**: querying `wedding_members` inside a `wedding_members`
   policy causes Postgres to check RLS on `wedding_members` while already evaluating it

### Security definer helper (required)

A `SECURITY DEFINER` function bypasses RLS on `wedding_members`, avoiding recursion:

```sql
CREATE OR REPLACE FUNCTION get_my_wedding_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid() LIMIT 1;
$$;
```

> **Note:** `STABLE` is a hint, not a contract. Postgres may inline the function body into
> the calling query, which defeats single-evaluation. To guarantee the function runs once
> per query (not once per row), always wrap calls in a scalar subquery in every policy.

### Wedding-scoped policy template

```sql
-- Correct: scalar subquery wrapper forces single evaluation per query
USING (wedding_id = (SELECT get_my_wedding_id()))
```

The `(SELECT ...)` wrapper is what forces Postgres to evaluate the function once and treat
the result as a constant for the duration of the query. Without it, Postgres may inline the
function body and re-evaluate it per row regardless of `STABLE`.

**Do NOT use** `IN (SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid())` —
this causes the per-row and recursion problems described above.

### wedding_members — recursion exception

The helper itself queries `wedding_members`, so it cannot be used in `wedding_members`
policies. Use a self-join with an alias instead:

```sql
CREATE POLICY "wedding_members_select" ON wedding_members FOR SELECT TO authenticated
  USING (wedding_id IN (
    SELECT wedding_id FROM wedding_members wm
    WHERE wm.user_id = (SELECT auth.uid())
  ));
```

This is safe because the alias `wm` prevents the recursive loop Postgres would otherwise
detect when the table references itself directly in its own policy.

### User-scoped policy (votes — write)

```sql
USING (user_id = (SELECT auth.uid()));
```

### Vote visibility rule

Partners cannot see each other's rating until both have voted on that option. The SELECT
policy uses an `EXISTS` check — not a count — so it is indexed via the `UNIQUE(option_id,
user_id)` constraint on `votes`:

```sql
CREATE POLICY "votes_select" ON votes FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM votes my_vote
      WHERE my_vote.option_id = votes.option_id
        AND my_vote.user_id = (SELECT auth.uid())
    )
  );
```

### Invite token lookup — use service role at API layer

Token-based invite lookup (`/api/invite/claim`) must use the **service role key** server-side
to fetch and validate the invite by token. Do not add a wide-open `BY TOKEN` SELECT policy
in RLS — the token is authorization itself, not just a filter.

### RLS indexes (required for performance)

Create these indexes in a dedicated migration **after** the schema migration but **before**
the policy migrations:

```sql
CREATE INDEX wedding_members_user_id_idx ON wedding_members (user_id);
CREATE INDEX wedding_members_wedding_id_idx ON wedding_members (wedding_id);
CREATE INDEX milestones_wedding_id_idx ON milestones (wedding_id);
CREATE INDEX decisions_wedding_id_idx ON decisions (wedding_id);
CREATE INDEX decision_options_decision_id_idx ON decision_options (decision_id);
CREATE INDEX votes_option_id_idx ON votes (option_id);
CREATE INDEX votes_user_id_idx ON votes (user_id);
CREATE INDEX budget_categories_wedding_id_idx ON budget_categories (wedding_id);
CREATE INDEX expenses_budget_category_id_idx ON expenses (budget_category_id);
CREATE INDEX guests_wedding_id_idx ON guests (wedding_id);
CREATE INDEX invites_wedding_id_idx ON invites (wedding_id);
CREATE INDEX invites_token_idx ON invites (token);
```

### Max-2 members enforcement

RLS cannot count rows — enforce the 2-member limit with a `BEFORE INSERT` trigger:

```sql
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

### Testing policies in SQL editor

```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'test-uuid';
```

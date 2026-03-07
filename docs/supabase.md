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

### Wedding-scoped policy template

```sql
USING (
  wedding_id IN (
    SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
  )
);
```

### User-scoped policy (votes)

```sql
USING (user_id = auth.uid());
```

### Testing policies in SQL editor

```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'test-uuid';
```

### Vote visibility rule

Votes SELECT is restricted until both partners have voted on an option — requires a subquery verifying both votes exist before revealing either.

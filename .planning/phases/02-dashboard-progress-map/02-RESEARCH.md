# Phase 2: Dashboard + Progress Map - Research

**Researched:** 2026-03-22
**Domain:** Next.js 15 App Router — Server Components, Server Actions, optimistic UI, Supabase RLS, Tailwind v4 / shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Milestone map visual style**
- Card grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile (matches max-w-5xl app layout)
- Each card shows: milestone title, status badge (clickable), and a free-text notes field
- Notes are optional and edited inline — click to activate textarea, save on blur or Enter
- Cards sorted by status: in_progress first, then not_started, then complete
- "+" card appended at end of grid as the custom milestone add action (same size as other cards)

**Milestone status toggle**
- Clicking the status badge cycles through: `not_started → in_progress → complete → not_started` (full 3-state loop, no skipping)
- Optimistic update: badge flips immediately, Supabase write fires in background; revert + toast on error
- Status visual treatment: terracotta fill for complete, muted amber for in_progress, neutral for not_started

**Dashboard layout**
- Page heading: wedding name as serif h1 at top (personal, warm)
- Full-width row of 4 budget stat cards (Total / Allocated / Spent / Remaining) below the heading
- Milestone card grid occupies the rest of the page below the budget row
- No gating: milestones are fully usable regardless of whether a budget has been set

**Empty / just-onboarded state**
- Welcome banner shown at top on first visit: "🥂 Welcome to Twogether! Set your budget in Settings, then start planning." with a [Dismiss] button
- Dismissed state stored as `dismissed_welcome boolean` on the `weddings` table — one-time, device-agnostic
- Budget stat cards are muted/dimmed with a "Set in Settings →" hint link when `total_budget` is 0 or null
- Milestone cards are fully interactive from day one — no budget required to start toggling statuses

### Claude's Discretion
- Exact spacing, shadow depth, and border radius on milestone cards
- Loading/skeleton state design while milestone data fetches
- Error state handling (failed status toggle, failed note save)
- Exact color tokens for status badge variants (within the terracotta/warm palette established in Phase 1)

### Deferred Ideas (OUT OF SCOPE)
- **Milestone-type-specific fields** — type metadata, JSONB or type-specific columns, different card UI per type. Defer to Phase 7 or v2 milestone templates feature.
- **Manual milestone reordering** — Drag-to-reorder is v2. Up/down buttons not in Phase 2 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Dashboard shows budget snapshot: total budget, total allocated, total spent, remaining | Budget totals computed via Supabase aggregate queries on `budget_categories` + `expenses` in a Server Component |
| DASH-02 | Dashboard budget totals update when expenses or budget settings change | Server Component fetch on each navigation; no caching beyond Next.js default; mutations call `revalidatePath("/dashboard")` |
| DASH-03 | Dashboard shows milestone progress map with status-based visual indicators | Client Component MilestoneGrid with optimistic state; status badge uses terracotta palette tokens |
| DASH-04 | Dashboard is accessible only to authenticated members of that wedding | `(app)/layout.tsx` already gates with `supabase.auth.getUser()` redirect; milestones RLS enforces wedding scope |
| MILE-01 | 9 default milestones are seeded automatically on wedding creation | DB trigger on `weddings` INSERT — new migration file with `seed_default_milestones()` function |
| MILE-02 | Either partner can toggle a milestone's status (not_started / in_progress / complete) | Server action `toggleMilestoneStatus`; optimistic update via `useOptimistic` in Client Component |
| MILE-03 | Either partner can add a custom milestone appended to the list | Server action `addMilestone`; "+" card in grid opens inline title input |
| MILE-04 | Progress map visually distinguishes all three milestone statuses | Status badge variant classes derived from status value; three distinct visual states using terracotta palette |
</phase_requirements>

---

## Summary

Phase 2 builds the dashboard — the primary landing screen after login. It has two main visual sections: a row of 4 budget stat cards (read-only aggregates from empty tables until Phase 4) and a milestone card grid. The milestone grid is the interactive heart of this phase, requiring optimistic status toggles, inline note editing, and a "+" card for custom milestone addition.

The schema already has the `milestones` table with `status` and `sort_order` columns. Two columns are missing and require new migrations: `notes text` on `milestones`, and `dismissed_welcome boolean DEFAULT false` on `weddings`. Default milestone seeding requires a new DB trigger on `weddings` INSERT — the existing trigger file only enforces the 2-member cap on `wedding_members`.

The primary architectural challenge is the status toggle: it must feel instant (optimistic) but also revert correctly if the Supabase write fails. React 19's `useOptimistic` hook (already used in Phase 1 via `useActionState`) is the correct tool. The inline note-save pattern (click → textarea → blur/Enter → save) requires a small controlled Client Component for the card's note area.

**Primary recommendation:** Split the dashboard page into a Server Component (`page.tsx`) that fetches all data, plus two Client Components — `MilestoneGrid` (handles optimistic toggle + add) and `WelcomeBanner` (handles dismiss). Budget cards stay as a pure Server-rendered presentational component.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (installed) | Server Components + Server Actions | Already in use; project convention |
| Supabase JS | 2.x (installed) | DB reads + mutations | Already in use; RLS enforced |
| shadcn/ui Card | Already installed | Budget stat cards + milestone cards | Already in components/ui/card.tsx |
| shadcn/ui Button | Already installed | Status badge interactions, dismiss | Already in components/ui/button.tsx |
| shadcn/ui Input | Already installed | Inline note textarea, custom milestone title | Already in components/ui/input.tsx |
| React 19 `useOptimistic` | Built into React 19 | Instant status badge flip with revert | Same hook family as `useActionState` used in Phase 1 |
| React 19 `useTransition` | Built into React 19 | Wrap server action calls during optimistic update | Pairs with `useOptimistic` |
| Tailwind v4 | Installed (OKLCH palette) | Status badge color variants | Terracotta tokens already defined in globals.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `revalidatePath` (next/cache) | Built-in | Invalidate dashboard cache after mutations | Called inside every server action that mutates DB |
| `tw-animate-css` | Installed | Card hover / badge transition animations | Already imported in globals.css |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useOptimistic` | SWR optimistic updates | `useOptimistic` is native React 19 and pairs with Server Actions; no extra dep needed |
| DB trigger for seed | Application-level seeding in `createWeddingAction` | Trigger is more reliable (fires even if app code is bypassed); consistent with existing trigger pattern |

**No new npm packages required.** Everything is already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(app)/dashboard/
├── page.tsx              # Server Component — fetches wedding, milestones, budget totals
├── actions.ts            # Server Actions — toggle status, save note, add milestone, dismiss banner
├── MilestoneGrid.tsx     # Client Component — optimistic grid, "+" add card
├── MilestoneCard.tsx     # Client Component — individual card with status badge + inline notes
└── WelcomeBanner.tsx     # Client Component — dismiss logic

supabase/migrations/
└── 20260322000001_phase2_columns.sql   # Add notes to milestones, dismissed_welcome to weddings, seed trigger
```

### Pattern 1: Server Component Data Fetch
**What:** `page.tsx` is an async Server Component that fetches all dashboard data in parallel and passes it as props to Client Components.
**When to use:** Whenever data is read-only and does not require client interactivity at the fetch layer.

```typescript
// src/app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parallel fetches
  const [weddingRes, milestonesRes, budgetRes] = await Promise.all([
    supabase
      .from("weddings")
      .select("id, name, total_budget, dismissed_welcome")
      .eq("id", /* get_my_wedding_id via RLS — just select */ "")  // RLS scopes automatically
      .single(),
    supabase
      .from("milestones")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("budget_categories")
      .select("allocated_amount, expenses(amount, status)"),
  ]);

  // Derive totals from raw data (no SQL aggregation needed for Phase 2 empty state)
  // ...pass as props
}
```

Note: Because RLS is active and `get_my_wedding_id()` scopes all queries, no explicit `wedding_id` filter is needed in the client query — the RLS policy handles it. The wedding SELECT returns the single row matching the current user's wedding.

### Pattern 2: Optimistic Status Toggle
**What:** Client Component wraps milestone list in `useOptimistic`, fires server action, reverts on error.
**When to use:** Any mutation that must feel instant in the UI.

```typescript
// src/app/(app)/dashboard/MilestoneGrid.tsx
"use client";
import { useOptimistic, useTransition } from "react";
import { toggleMilestoneStatus } from "./actions";

type MilestoneStatus = "not_started" | "in_progress" | "complete";

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  not_started: "in_progress",
  in_progress: "complete",
  complete: "not_started",
};

export function MilestoneGrid({ milestones }: { milestones: Milestone[] }) {
  const [optimisticMilestones, setOptimistic] = useOptimistic(milestones);
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, currentStatus: MilestoneStatus) {
    const nextStatus = NEXT_STATUS[currentStatus];
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
      );
      const result = await toggleMilestoneStatus(id, nextStatus);
      if (result?.error) {
        // useOptimistic auto-reverts when the transition ends with an error path
        // Show toast with result.error
      }
    });
  }
  // ...
}
```

### Pattern 3: Server Action with revalidatePath
**What:** Server actions mutate Supabase, then call `revalidatePath` so the next navigation gets fresh data.
**When to use:** Every mutation action in this phase.

```typescript
// src/app/(app)/dashboard/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleMilestoneStatus(
  id: string,
  newStatus: "not_started" | "in_progress" | "complete"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("milestones")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
```

### Pattern 4: DB Trigger for Default Milestone Seeding
**What:** PostgreSQL function + trigger fires after INSERT on `weddings` to insert 9 default milestone rows.
**When to use:** Data that must always be seeded when a wedding is created, regardless of application layer.

```sql
-- Migration: add seed trigger
CREATE OR REPLACE FUNCTION seed_default_milestones()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
    (NEW.id, 'Venue',        'not_started', true, 1),
    (NEW.id, 'Catering',     'not_started', true, 2),
    (NEW.id, 'Photography',  'not_started', true, 3),
    (NEW.id, 'Music',        'not_started', true, 4),
    (NEW.id, 'Flowers',      'not_started', true, 5),
    (NEW.id, 'Attire',       'not_started', true, 6),
    (NEW.id, 'Invitations',  'not_started', true, 7),
    (NEW.id, 'Honeymoon',    'not_started', true, 8),
    (NEW.id, 'Guest List',   'not_started', true, 9);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_milestones_trigger
  AFTER INSERT ON weddings
  FOR EACH ROW EXECUTE FUNCTION seed_default_milestones();
```

The trigger fires AFTER INSERT so `NEW.id` is committed and safe to reference as a foreign key.

### Pattern 5: Inline Note Edit
**What:** Note field on a milestone card is a `<p>` by default; clicking it becomes a `<textarea>`, saves on blur or Enter, reverts on Escape.
**When to use:** Lightweight inline editing where a full modal is overkill.

```typescript
// Inside MilestoneCard.tsx
"use client";
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState(notes ?? "");

function handleSave() {
  setEditing(false);
  if (draft !== notes) {
    startTransition(() => saveMilestoneNote(id, draft));
  }
}
```

### Status Badge Color Mapping
Using the established terracotta palette from `globals.css`:

| Status | Tailwind classes | Visual |
|--------|-----------------|--------|
| `complete` | `bg-[--color-terracotta-500] text-white` | Solid terracotta fill |
| `in_progress` | `bg-[--color-terracotta-100] text-[--color-terracotta-700]` | Muted amber-terracotta tint |
| `not_started` | `bg-muted text-muted-foreground` | Neutral grey |

### Sort Order (Client-side)
The CONTEXT.md locks the sort order to: `in_progress` first, then `not_started`, then `complete`. Since data is fetched sorted by `sort_order` from the DB, apply a client-side secondary sort within the grid:

```typescript
const STATUS_PRIORITY: Record<MilestoneStatus, number> = {
  in_progress: 0,
  not_started: 1,
  complete: 2,
};

const sorted = [...milestones].sort(
  (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
);
```

### Anti-Patterns to Avoid
- **Using `getSession()` instead of `getUser()`:** Project convention is strict — always `supabase.auth.getUser()`.
- **Direct Supabase calls from Client Components:** Only server actions and server components may call Supabase. Client components call server actions.
- **Throwing errors from server actions:** Return `{ error: string }` always; only rethrow `NEXT_REDIRECT`.
- **Forgetting `revalidatePath`:** Without it, the Server Component cache won't bust and the page will show stale data after mutations.
- **Putting the seed trigger BEFORE INSERT:** Must be AFTER INSERT so the `NEW.id` UUID exists in the `weddings` table before it's used as a foreign key in `milestones`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic UI | Custom local state + manual revert logic | `useOptimistic` + `useTransition` | React 19 handles the revert automatically when the transition completes |
| Card UI structure | Custom div layout | shadcn/ui `Card`, `CardHeader`, `CardContent` | Already installed; consistent border-radius, ring, padding via data-slot pattern |
| Auth guard | Manual redirect logic in page.tsx | `(app)/layout.tsx` already redirects unauthenticated users | Layout gate applies to all pages under `(app)/` including dashboard |
| Budget aggregation SQL | Complex subquery or view | Simple JS reduce over fetched `budget_categories` + nested `expenses` | Phase 2 data is always empty; don't over-engineer; Phase 4 can add SQL aggregate if needed |
| Status cycle logic | Switch statement repeated in multiple places | Single `NEXT_STATUS` map defined once at module level | One source of truth, easy to test |

**Key insight:** The optimistic update pattern with `useOptimistic` is idiomatic React 19 + Next.js 15 Server Actions — do not reach for SWR, React Query, or custom state management for this use case.

---

## Common Pitfalls

### Pitfall 1: Milestone Seeding for Existing Weddings
**What goes wrong:** The DB trigger only fires on new `weddings` INSERT. Any wedding created during Phase 1 testing (before this migration) will have 0 milestones.
**Why it happens:** Trigger is retroactive only from the migration point forward.
**How to avoid:** Include a one-time backfill in the migration — after creating the trigger, also INSERT default milestones for any existing wedding that has 0 milestone rows.
**Warning signs:** Dashboard shows empty grid after login with a Phase 1 test account.

```sql
-- Backfill existing weddings with no milestones
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM weddings
    WHERE id NOT IN (SELECT DISTINCT wedding_id FROM milestones)
  LOOP
    INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
      (r.id, 'Venue',       'not_started', true, 1),
      -- ... etc
      (r.id, 'Guest List',  'not_started', true, 9);
  END LOOP;
END $$;
```

### Pitfall 2: RLS — Wedding SELECT Returns No Row
**What goes wrong:** `supabase.from("weddings").select("*").single()` throws a "no rows" error if the user has no wedding membership yet.
**Why it happens:** `get_my_wedding_id()` returns NULL if `wedding_members` has no row for this user; the RLS `USING` clause evaluates to false.
**How to avoid:** Use `.maybeSingle()` instead of `.single()` and handle the `null` case by redirecting to `/onboarding`.
**Warning signs:** Dashboard page throws unhandled promise rejection after fresh signup.

### Pitfall 3: Optimistic Update Not Reverting
**What goes wrong:** Badge shows new status but DB write failed; the badge stays in the wrong state.
**Why it happens:** `useOptimistic` reverts automatically when the `startTransition` callback completes, but only if the developer does NOT manually call `setOptimistic` again after the error.
**How to avoid:** Inside the `startTransition` callback, call `setOptimistic` once at the start (the optimistic value), then let the transition end. Do not call `setOptimistic` in the error branch. Show a toast using the returned `result.error`.
**Warning signs:** After a network failure, badge shows the wrong status permanently until page refresh.

### Pitfall 4: `notes` Column Missing — Migration Order
**What goes wrong:** Server action tries to UPDATE `milestones.notes` but column doesn't exist yet.
**Why it happens:** Phase 2 migration not applied before code is deployed / tested.
**How to avoid:** Put all three schema changes (add `notes` to milestones, add `dismissed_welcome` to weddings, add seed trigger) in a SINGLE migration file so they apply atomically.
**Warning signs:** `column "notes" of relation "milestones" does not exist` Supabase error.

### Pitfall 5: Sort by Status Reordering on Optimistic Toggle
**What goes wrong:** Card jumps to a new grid position the instant the badge is clicked, causing jarring visual reorder.
**Why it happens:** Sorting by `STATUS_PRIORITY` re-runs whenever `optimisticMilestones` updates, which happens immediately on badge click.
**How to avoid:** Either (a) sort once on the initial data and not on optimistic state, or (b) animate the reorder using CSS transitions with a stable key. Option (a) is simpler: sort the initial prop array in the Server Component and don't re-sort within `useOptimistic` updates.
**Warning signs:** Cards fly around the grid on every badge click.

### Pitfall 6: Dismissed Welcome Banner Stored Correctly
**What goes wrong:** Dismiss action updates `weddings` but the RLS UPDATE policy may not match `created_by` logic.
**Why it happens:** Phase 1's `weddings_update` policy uses `get_my_wedding_id()` for both USING and WITH CHECK — this is correct, but only works if the user has a `wedding_members` row at the time of the call.
**How to avoid:** Verify with Supabase MCP that the current `weddings_update` policy allows updates from both the owner and (eventually) the partner. For Phase 2 (single user only), the existing policy is sufficient.
**Warning signs:** Dismiss action returns RLS violation error.

---

## Code Examples

### Budget Stat Cards (Server-rendered)
```typescript
// Compute totals from fetched data (Phase 2: all zeros from empty tables)
const totalBudget = wedding?.total_budget ?? 0;
const allocated = categories?.reduce((sum, c) => sum + (c.allocated_amount ?? 0), 0) ?? 0;
const spent = categories?.flatMap(c => c.expenses ?? [])
  .filter(e => e.status === "paid")
  .reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0;
const remaining = totalBudget - spent;

// Muted state when no budget set
const budgetEmpty = totalBudget === 0;
```

### Welcome Banner Dismiss Action
```typescript
// actions.ts
export async function dismissWelcomeBanner(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const weddingId = await getMyWeddingId(supabase); // helper that calls get_my_wedding_id
  if (!weddingId) return { error: "No wedding found" };
  const { error } = await supabase
    .from("weddings")
    .update({ dismissed_welcome: true })
    .eq("id", weddingId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
```

### Add Custom Milestone
```typescript
// actions.ts
export async function addMilestone(title: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get next sort_order
  const { data: existing } = await supabase
    .from("milestones")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (existing?.sort_order ?? 0) + 1;

  // RLS scopes wedding_id automatically via INSERT policy
  // But we need to provide wedding_id explicitly in the INSERT
  // Use a SQL function or fetch wedding_id first
  const { data: member } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "No wedding found" };

  const { error } = await supabase
    .from("milestones")
    .insert({
      wedding_id: member.wedding_id,
      title: title.trim(),
      status: "not_started",
      is_default: false,
      sort_order: nextOrder,
    });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
```

---

## Schema Changes Required

This section details the exact migration needed before any code can be tested.

```sql
-- Migration: 20260322000001_phase2_schema.sql

-- 1. Add notes column to milestones
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS notes text;

-- 2. Add dismissed_welcome column to weddings
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dismissed_welcome boolean NOT NULL DEFAULT false;

-- 3. Seed default milestones trigger
CREATE OR REPLACE FUNCTION seed_default_milestones()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
    (NEW.id, 'Venue',        'not_started', true, 1),
    (NEW.id, 'Catering',     'not_started', true, 2),
    (NEW.id, 'Photography',  'not_started', true, 3),
    (NEW.id, 'Music',        'not_started', true, 4),
    (NEW.id, 'Flowers',      'not_started', true, 5),
    (NEW.id, 'Attire',       'not_started', true, 6),
    (NEW.id, 'Invitations',  'not_started', true, 7),
    (NEW.id, 'Honeymoon',    'not_started', true, 8),
    (NEW.id, 'Guest List',   'not_started', true, 9);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_milestones_trigger
  AFTER INSERT ON weddings
  FOR EACH ROW EXECUTE FUNCTION seed_default_milestones();

-- 4. Backfill existing weddings that have no milestones
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM weddings
    WHERE id NOT IN (SELECT DISTINCT wedding_id FROM milestones)
  LOOP
    INSERT INTO milestones (wedding_id, title, status, is_default, sort_order) VALUES
      (r.id, 'Venue',        'not_started', true, 1),
      (r.id, 'Catering',     'not_started', true, 2),
      (r.id, 'Photography',  'not_started', true, 3),
      (r.id, 'Music',        'not_started', true, 4),
      (r.id, 'Flowers',      'not_started', true, 5),
      (r.id, 'Attire',       'not_started', true, 6),
      (r.id, 'Invitations',  'not_started', true, 7),
      (r.id, 'Honeymoon',    'not_started', true, 8),
      (r.id, 'Guest List',   'not_started', true, 9);
  END LOOP;
END $$;
```

After applying, run:
```bash
supabase gen types typescript --local > types/supabase.ts
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` | `useActionState` | React 19 / Next.js 15 | Already used in Phase 1 — use `useActionState` |
| Manual optimistic state + setTimeout revert | `useOptimistic` + `useTransition` | React 19 | Automatic revert when transition ends |
| `getSession()` for auth check | `getUser()` | Supabase auth v2 best practice | Already enforced in CLAUDE.md |
| Client-side fetch with useEffect | Server Components async fetch | Next.js 13+ App Router | Already the project pattern |

**Deprecated/outdated:**
- `useFormState`: Replaced by `useActionState` in React 19. Phase 1 already uses `useActionState`.
- `router.refresh()` for cache invalidation: Use `revalidatePath()` in server actions instead.

---

## Open Questions

1. **Toast library for error feedback**
   - What we know: No toast library is currently installed. The status toggle error requires user feedback.
   - What's unclear: Should we install `sonner` (common with shadcn/ui) or use a simpler inline error state?
   - Recommendation: Install `sonner` — it's the shadcn/ui recommended toast library and adds minimal bundle weight. Alternatively, use an inline error state on the card for simplicity. Planner should decide — either approach is valid for Phase 2.

2. **Wedding ID fetch pattern in server actions**
   - What we know: Server actions need `wedding_id` to INSERT milestones. `get_my_wedding_id()` is a DB function available via RLS, not a JS helper.
   - What's unclear: Whether to call `get_my_wedding_id()` via `supabase.rpc()` or do a `wedding_members` lookup in the action.
   - Recommendation: Use `supabase.from("wedding_members").select("wedding_id").eq("user_id", user.id).single()` — avoids an additional RPC call and is clear in intent. This is what `createWeddingAction` already does implicitly.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files present |
| Config file | None — Wave 0 must create |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Budget stat cards show correct totals (0 when empty) | unit (pure function) | TBD — `npm test` | ❌ Wave 0 |
| DASH-02 | `revalidatePath` called after budget mutations | integration | Manual smoke | ❌ Wave 0 |
| DASH-03 | Milestone grid renders with status badges | smoke | Playwright MCP | N/A |
| DASH-04 | Unauthenticated request to `/dashboard` redirects to `/login` | e2e | Playwright MCP | N/A |
| MILE-01 | After onboarding, 9 milestones exist in DB | integration | Supabase MCP SQL verify | N/A |
| MILE-02 | Status toggle cycles correctly through 3 states | unit | TBD — `npm test` | ❌ Wave 0 |
| MILE-03 | Custom milestone add appends with correct sort_order | integration | Manual smoke | N/A |
| MILE-04 | Each status maps to distinct CSS class | unit | TBD — `npm test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual smoke via `npm run dev` + Playwright MCP visual check
- **Per wave merge:** Full Playwright MCP flow — login, see milestones, toggle badge, add custom, dismiss banner
- **Phase gate:** All success criteria from phase description verified before `/gsd:verify-work`

### Wave 0 Gaps
Given no test framework exists, the planner should decide whether to:
- (a) Add a Wave 0 task to install Vitest + React Testing Library for unit tests of pure functions (status cycle map, budget total reducer)
- (b) Rely entirely on Playwright MCP for smoke testing and Supabase MCP for DB verification

For this phase specifically, the testable logic (status cycle map, budget reducer) is simple enough that option (b) is reasonable. The planner can make this call.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection — `src/`, `supabase/migrations/`, `types/`, `src/components/ui/` — direct file reads
- React 19 `useOptimistic` docs — built-in hook behavior verified against project's existing `useActionState` usage (same React 19 hook family)
- Next.js App Router patterns — Server Components, Server Actions, `revalidatePath` — consistent with CLAUDE.md and Phase 1 implementation

### Secondary (MEDIUM confidence)
- Supabase RLS patterns — verified against existing migration files; `get_my_wedding_id()` pattern confirmed in `20240101000002_helper.sql`
- PostgreSQL AFTER INSERT trigger pattern — standard SQL; confirmed safe FK reference ordering

### Tertiary (LOW confidence)
- Status sort visual UX (in_progress first) — from CONTEXT.md locked decision, not independently validated against UX research
- 9 default milestone names (Venue, Catering, Photography, etc.) — reasonable defaults; not sourced from a wedding industry standard

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; no new dependencies required
- Architecture: HIGH — patterns directly follow existing Phase 1 code and project CLAUDE.md conventions
- Schema changes: HIGH — column names verified against existing migration; trigger pattern follows existing trigger in `20240101000005_trigger.sql`
- Pitfalls: HIGH — derived from direct code inspection of RLS policies, existing actions, and React 19 `useOptimistic` semantics
- Status color tokens: MEDIUM — color values confirmed from `globals.css`; specific class combinations are Claude's discretion per CONTEXT.md

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack — no fast-moving dependencies)

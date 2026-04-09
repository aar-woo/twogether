# Phase 5: Guest List - Research

**Researched:** 2026-04-08
**Domain:** Next.js 15 App Router — Supabase CRUD with table UI and computed summary stats
**Confidence:** HIGH

## Summary

Phase 5 is a straightforward CRUD page. The `guests` table and all four RLS policies (SELECT, INSERT, UPDATE, DELETE) are already in place from Phase 1 — no migration is needed. This phase is purely UI + server actions work. All patterns have been established in Phases 2–4 and can be followed directly: Server Component page, Client Component with inline table editing, server actions returning `{ error?: string }`, `useOptimistic` + `useTransition` for immediate feedback.

The key design decision (table with inline row editing) is locked via D-03 through D-05. The shadcn `select` component is NOT currently installed (`src/components/ui/select.tsx` does not exist) — it must be added via `npx shadcn@latest add select` before the dropdown fields can be built. This is the only non-trivial setup step.

The summary section (GUES-03) is pure derived state — count guests where `invited === true`, group by `side`, group by `relationship` — all computable from the guest array already fetched for the table. No separate query needed.

**Primary recommendation:** Follow the BudgetClient pattern exactly — Server Component page, single Client Component, `useOptimistic` array replacement for instant toggle/edit, `router.refresh()` after mutations. Add `shadcn select` component in Wave 0. No migration needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Side is a predefined dropdown with 3 options: Bride / Groom / Both. Not freeform.
- **D-02:** Relationship is a predefined dropdown with 4 options: Family / Friend / Colleague / Plus One. Not freeform.
- **D-03:** Guest list displayed as a table with columns: Name | Side | Relationship | Invited | Actions. Dense, scannable.
- **D-04:** `+ Add Guest` button reveals an inline form row at the top of the table — consistent with budget/decisions inline expansion pattern.
- **D-05:** Clicking Edit turns the table row into editable fields in-place — consistent with budget category/expense inline edit pattern.

### Claude's Discretion
- Summary section placement (top vs. bottom of page) and visual style (stat cards vs. inline text)
- Invited toggle UX: quick-toggle in the row or only via edit form — follow the most natural table UX
- Empty state when no guests exist yet
- Delete confirmation behavior (inline confirm vs. immediate with undo)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GUES-01 | Either partner can add a guest with name, relationship, side, and invited status | `guests` table and RLS policies are in place; `createGuest` server action pattern mirrors `createCategory` in budget/actions.ts; inline form row at table top (D-04) |
| GUES-02 | Guests can be edited and deleted | Inline row edit (D-05) mirrors budget category edit; delete with inline confirm mirrors budget category delete; `updateGuest` / `deleteGuest` actions follow budget action pattern |
| GUES-03 | Summary section shows total invited count plus breakdowns by side and relationship | Pure derived state from guest array — filter `invited === true`, group by `side`, group by `relationship`; computed inside Client Component, no extra query |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (project) | Server Components + server actions | Project standard |
| Supabase JS | 2.x (project) | DB queries via RLS | Project standard |
| shadcn/ui | latest (project) | UI primitives | Project standard |
| React `useOptimistic` + `useTransition` | React 19 (project) | Instant local state for mutations | Established in Phases 2–4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn `select` | latest | Dropdown for side/relationship fields | Must be installed — not yet present |
| lucide-react | project | Pencil, Trash2 icons | Action buttons in table rows |

### Missing Component — Action Required
`src/components/ui/select.tsx` does not exist. Install in Wave 0:
```bash
npx shadcn@latest add select
```

**Existing components available without install:**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/textarea.tsx`

## Architecture Patterns

### Recommended Project Structure
```
src/app/(app)/guests/
├── page.tsx          # Server Component — auth check, wedding fetch, getGuests(), renders GuestClient
├── GuestClient.tsx   # "use client" — table, inline add row, inline edit row, summary section
└── actions.ts        # "use server" — getGuests, createGuest, updateGuest, deleteGuest
```

### Pattern 1: Server Component Page (mirrors budget/page.tsx exactly)
**What:** Auth check → wedding fetch via `maybeSingle()` → call `getGuests(wedding.id)` → render Client Component
**When to use:** Every (app) route page

```typescript
// Source: src/app/(app)/budget/page.tsx (established pattern)
export default async function GuestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, name")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const { guests } = await getGuests(wedding.id);

  return <GuestClient weddingId={wedding.id} guests={guests ?? []} />;
}
```

### Pattern 2: Server Action (mirrors budget/actions.ts)
**What:** Auth check → get wedding_id from `wedding_members` → mutate → `revalidatePath('/guests')` → return `{ error?: string }`
**When to use:** All writes (create, update, delete)

```typescript
// Source: src/app/(app)/budget/actions.ts (established pattern)
export async function createGuest(
  name: string,
  side: string | null,
  relationship: string | null,
  invited: boolean,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: member } = await supabase
      .from("wedding_members")
      .select("wedding_id")
      .eq("user_id", user.id)
      .single();

    if (!member) return { error: "No wedding found" };

    const { error } = await supabase.from("guests").insert({
      wedding_id: member.wedding_id,
      name,
      side,
      relationship,
      invited,
    });

    if (error) return { error: error.message };
    revalidatePath("/guests");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

### Pattern 3: useOptimistic for Invited Toggle
**What:** `useOptimistic` with an array reducer that replaces one guest's `invited` value; `useTransition` wraps the server action call; `router.refresh()` after success to sync server state.
**When to use:** Invited column toggle — most natural UX is a quick-toggle checkbox/button directly in the table row (Claude's discretion).

```typescript
// Source: src/app/(app)/dashboard/MilestoneGrid.tsx + budget/BudgetClient.tsx (established pattern)
const [optimisticGuests, setOptimisticGuests] = useOptimistic(
  guests,
  (prev, update: { id: string; invited: boolean }) =>
    prev.map((g) => (g.id === update.id ? { ...g, invited: update.invited } : g)),
);

function handleToggleInvited(id: string, current: boolean) {
  startTransition(async () => {
    setOptimisticGuests({ id, invited: !current });
    const result = await updateGuest(id, { invited: !current });
    if (result?.error) setError(result.error);
    else router.refresh();
  });
}
```

### Pattern 4: Summary Section (Derived State)
**What:** Compute summary stats from `optimisticGuests` (not raw `guests`) so the summary reflects pending optimistic updates.
**When to use:** GUES-03 summary section — no extra query needed.

```typescript
// Derived from optimistic guest array
const totalInvited = optimisticGuests.filter((g) => g.invited).length;
const bySide = optimisticGuests.reduce<Record<string, number>>((acc, g) => {
  const key = g.side ?? "Unknown";
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
const byRelationship = optimisticGuests.reduce<Record<string, number>>((acc, g) => {
  const key = g.relationship ?? "Unknown";
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
```

### Pattern 5: Inline Table Row States
**What:** Each row renders one of three states — normal display, editing (fields in-place), deleting (inline confirm). Controlled by `editingGuestId` and `deletingGuestId` state vars.
**When to use:** D-05 (edit in-place), Claude's discretion (inline confirm for delete).

This mirrors exactly how budget categories work in `BudgetClient.tsx` (lines 504–597).

### Anti-Patterns to Avoid
- **Using `getSession()` for auth:** Always `supabase.auth.getUser()` — established project rule.
- **Querying Supabase in Client Components:** All queries in `actions.ts` or Server Components only.
- **Computing summary from `guests` prop instead of `optimisticGuests`:** Summary would lag behind optimistic updates; always derive from the optimistic array.
- **Separate query for summary counts:** The guest array for the table is all that's needed — group/filter in component.
- **Adding `wedding_id` as a client-passed parameter to mutations:** For create, derive from `wedding_members` join in the action. For update/delete, the row `id` is sufficient — RLS ensures the user can only touch their own wedding's rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown UI for side/relationship | Custom `<select>` HTML | shadcn `Select` component | Consistent styling, keyboard nav, accessibility |
| Optimistic state management | Manual `useState` + rollback logic | `useOptimistic` (React 19) | React handles rollback automatically on transition failure |
| Auth/RLS enforcement | Manual wedding_id checks beyond what's there | Existing RLS policies in `guests` table | Full CRUD policies already written in `20240101000004_rls_policies.sql` |

**Key insight:** RLS is already fully configured for guests. The action pattern is fully established. This phase is mostly assembly of existing patterns, not invention.

## Runtime State Inventory

> Greenfield page (no existing /guests implementation). No rename/refactor involved.

Not applicable — this is a new page with no existing runtime state to migrate.

## Common Pitfalls

### Pitfall 1: Missing shadcn Select Component
**What goes wrong:** Build error — `@/components/ui/select` not found when GuestClient imports it.
**Why it happens:** `select.tsx` is not in the project yet. Only `button`, `input`, `label`, `card`, `textarea` exist.
**How to avoid:** Install in Wave 0 before writing any component code: `npx shadcn@latest add select`.
**Warning signs:** Missing import error at build time.

### Pitfall 2: Computing Summary from Stale `guests` Prop
**What goes wrong:** Invited toggle updates table row instantly (optimistic) but summary count doesn't update until `router.refresh()` completes.
**Why it happens:** Summary computed from `guests` prop (server data) instead of `optimisticGuests`.
**How to avoid:** Always derive summary stats from the `optimisticGuests` array, not the prop.
**Warning signs:** Success criterion 2 fails — "toggle invited; total invited count updates immediately."

### Pitfall 3: No Migration Needed — Don't Write One
**What goes wrong:** Writing an unnecessary migration that conflicts with existing schema or RLS.
**Why it happens:** Assuming the table doesn't exist or policies are missing.
**How to avoid:** Verify via Supabase MCP before any migration. The `guests` table with all four RLS policies is confirmed in `20240101000004_rls_policies.sql`.
**Warning signs:** Migration apply error about duplicate table/policy names.

### Pitfall 4: Select Component Value Handling
**What goes wrong:** shadcn `Select` uses `onValueChange` (not `onChange`) and requires `value`/`defaultValue` to be strings — `null` is not valid; use `""` as the "not set" sentinel or require selection.
**Why it happens:** shadcn Select API differs from native `<select>`.
**How to avoid:** Map null DB values to `""` in the edit form; map `""` back to `null` on save.
**Warning signs:** TypeScript error on `value={g.side}` when `side` is `string | null`.

### Pitfall 5: Inline Form Row vs. Table Structure
**What goes wrong:** Mixing `<tr>` inline form row inside a `<table>` causes layout issues; cells must match column count.
**Why it happens:** D-04 says "inline form row at the top of the table" but HTML table form rows require matching `<td>` structure.
**How to avoid:** Options: (a) use a full-width `<td colSpan={5}>` for the form row, (b) render the add form as a Card above the table (simpler, still "at the top"), (c) use CSS grid/div-based table layout instead of `<table>`. The budget pattern uses Cards and divs, not `<table>` HTML — follow that approach for consistency.
**Warning signs:** Broken table layout or hydration warnings.

## Code Examples

### getGuests action (mirrors getCategories)
```typescript
// Source: pattern from src/app/(app)/budget/actions.ts
export async function getGuests(weddingId: string): Promise<{
  guests?: GuestRow[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("guests")
    .select("id, name, side, relationship, invited, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { guests: data ?? [] };
}
```

### Guest type to add to types/index.ts
```typescript
// Add to types/index.ts
export type GuestSide = "Bride" | "Groom" | "Both";
export type GuestRelationship = "Family" | "Friend" | "Colleague" | "Plus One";

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  side: string | null;
  relationship: string | null;
  invited: boolean;
  created_at: string | null;
}
```

### Summary computation (inside GuestClient)
```typescript
// Derived state — always from optimisticGuests
const totalGuests = optimisticGuests.length;
const totalInvited = optimisticGuests.filter((g) => g.invited).length;

const SIDES = ["Bride", "Groom", "Both"] as const;
const RELATIONSHIPS = ["Family", "Friend", "Colleague", "Plus One"] as const;

const bySide = SIDES.map((side) => ({
  label: side,
  count: optimisticGuests.filter((g) => g.side === side).length,
}));

const byRelationship = RELATIONSHIPS.map((rel) => ({
  label: rel,
  count: optimisticGuests.filter((g) => g.relationship === rel).length,
}));
```

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is code/config only; `guests` table and RLS already exist; no new DB migrations needed).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in project |
| Config file | none |
| Quick run command | `npm run build && npm run lint` (build + lint as proxy) |
| Full suite command | `npx tsc --noEmit && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GUES-01 | Add guest with name/side/relationship/invited | manual-only (no test infra) | `npm run build` — verifies no type errors | ❌ |
| GUES-02 | Edit and delete guest | manual-only | `npm run build` | ❌ |
| GUES-03 | Summary counts correct by side/relationship | manual-only | `npm run build` | ❌ |

**Manual-only justification:** Project has no test framework installed (no jest/vitest/playwright config files detected). Verification relies on the success criteria from the phase description, checked manually via browser.

### Sampling Rate
- **Per task commit:** `npm run build && npm run lint`
- **Per wave merge:** `npx tsc --noEmit && npm run lint`
- **Phase gate:** All four success criteria verified manually in browser before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `npx shadcn@latest add select` — install Select component before any GuestClient code
- No test files to create — project has no test framework

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `supabase/migrations/20240101000004_rls_policies.sql` — confirmed all 4 guests RLS policies exist
- Direct code inspection: `types/supabase.ts` — confirmed guests table shape (`id`, `name`, `relationship`, `side`, `invited`, `wedding_id`, `created_at`)
- Direct code inspection: `src/app/(app)/budget/BudgetClient.tsx` — inline form row and inline row edit pattern
- Direct code inspection: `src/app/(app)/budget/actions.ts` — server action pattern with `{ error?: string }` returns
- Direct code inspection: `src/app/(app)/budget/page.tsx` — Server Component page pattern
- Direct code inspection: `src/components/ui/` — confirmed select.tsx is NOT present; button/input/label/card/textarea ARE present

### Secondary (MEDIUM confidence)
- STATE.md decisions log — confirmed `useOptimistic` + `useTransition` as canonical pattern, `maybeSingle()` for wedding fetch, `(SELECT get_my_wedding_id())` in RLS

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all stack choices confirmed by direct code inspection of Phase 4 implementation
- Architecture: HIGH — pattern is established and verified; guests table schema confirmed from generated types
- Pitfalls: HIGH for RLS/migration pitfalls (verified in code); MEDIUM for shadcn Select API details (based on training knowledge, should verify at install time)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack)

# Phase 4: Budget Tracking — Research

**Researched:** 2026-04-06
**Domain:** Next.js 15 App Router, Supabase RLS, accordion UI, inline form editing
**Confidence:** HIGH

## Summary

Phase 4 builds the `/budget` page entirely within the existing stack and schema. Both `budget_categories` and `expenses` tables already exist with full RLS policies, indexes, and a working dashboard query shape. No migrations are needed unless column gaps are discovered — a live schema verification step is still required before writing any SQL.

The implementation follows established Phase 3 patterns throughout: Server Component page fetch, client accordion/list components with `useState` + `useTransition`, server actions returning `{ error?: string }`, and `revalidatePath` for cache invalidation. The dashboard integration is already wired — mutations must call `revalidatePath('/budget')` and `revalidatePath('/dashboard')` together.

The color palette changed from terracotta to sage green in a quick task (260406-qvk). All new UI must use `bg-sage-*` / `text-sage-*` utility classes — never `terracotta`.

**Primary recommendation:** Model the budget page directly after the decisions/[id] page (OptionList.tsx pattern). Use a single `BudgetClient` client component that owns accordion open/close state, category inline-edit state, expense inline-edit state, and form expansion state. All Supabase queries live in `actions.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Summary stat bar at the top of `/budget` — 4 stat cards: Total / Allocated / Spent / Remaining. Mirrors the dashboard snapshot for consistency.
- **D-02:** Categories displayed as an accordion list below the summary bar. Each accordion header shows: category name, allocated amount, spent total.
- **D-03:** All accordions start collapsed by default. User expands the category they want to work on.
- **D-04:** `+ New Category` button above the accordion list expands an inline form (name + allocated amount fields + Cancel / Add Category buttons). Same pattern as `+ New Decision` in the queue.
- **D-05:** Editing an existing category uses inline edit on the accordion header row — an edit icon turns name and allocated amount into editable fields in place with Save / Cancel.
- **D-06:** Expenses are added via an inline form at the bottom of the expanded expense list — a `+ Add expense` action that expands into form fields. Same pattern as `+ Add option` in decisions.
- **D-07:** Required fields: vendor name, amount, status (paid/pending). Optional fields: date, note.
- **D-08:** Editing an existing expense uses inline edit on click — clicking the expense row turns it into an editable form in place with Save / Cancel.

### Claude's Discretion
- Exact visual treatment for paid vs pending expense rows
- Over-budget warning exact placement and styling (BUDG-02: at minimum near summary bar or category list header)
- Delete confirmation behavior (inline confirm vs immediate delete with undo)
- Empty state when no categories exist yet

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUDG-01 | Couple can create budget categories with a name and allocated amount | `budget_categories` table exists with `name`, `allocated_amount`, `wedding_id` columns; RLS SELECT/INSERT/UPDATE/DELETE policies exist |
| BUDG-02 | Inline warning appears when sum of allocated amounts exceeds total budget | Computed client-side: sum of `allocated_amount` vs `weddings.total_budget`; rendered in summary bar area |
| BUDG-03 | Expenses can be added within a category (vendor name, amount, date, status, note) | `expenses` table has all required columns; FK to `budget_category_id`; status CHECK constraint `IN ('pending', 'paid')` |
| BUDG-04 | Expenses can be edited and deleted | RLS UPDATE/DELETE policies on `expenses` already exist |
| BUDG-05 | Paid vs pending expenses are visually distinct | Implement with badge or row-level style using sage palette; status is `'paid'` or `'pending'` string |
| BUDG-06 | Dashboard budget totals reflect current category and expense data | Dashboard already queries these tables; budget mutations must `revalidatePath('/dashboard')` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (project) | Server Components, server actions, route groups | Established project foundation |
| Supabase JS | project version | DB reads/writes with RLS | All data access goes through this |
| shadcn/ui | project version | Card, Button, Input, Textarea components | Already installed; used in all phases |
| React `useTransition` | React 19 | Non-blocking server action calls | Established in Phases 2–3 |
| React `useOptimistic` | React 19 | Optional optimistic state for toggle-like UX | Used in MilestoneGrid.tsx — reference pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `revalidatePath` (next/cache) | Next.js built-in | Cache invalidation after mutations | Every server action that mutates budget data |
| `Intl.NumberFormat` | Browser built-in | Currency formatting | Summary bar + expense amounts (already used in dashboard) |

No new packages are needed for this phase.

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Structure
```
src/app/(app)/budget/
├── page.tsx           # Server Component — fetches wedding, categories+expenses; passes to BudgetClient
└── actions.ts         # "use server" — all DB mutations; queries needed by page
src/components/
└── (no new shared components — budget components stay colocated)
```

### Pattern 1: Server Component Page Fetch
**What:** `page.tsx` is an async Server Component that fetches all data and passes it as props to a client component.
**When to use:** This is the project default for all routes.
**Example:**
```typescript
// Mirrors dashboard/page.tsx structure
export default async function BudgetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, name, total_budget")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id, name, allocated_amount, expenses(id, vendor_name, amount, date, status, note, created_at)")
    .order("created_at", { ascending: true });

  return <BudgetClient wedding={wedding} categories={categories ?? []} />;
}
```

### Pattern 2: Inline Form Expansion (Category Creation — D-04)
**What:** A button toggles an inline form card. Matches `DecisionQueue.tsx` exactly.
**When to use:** Creating new top-level items in a list.
**Example:**
```typescript
// Source: src/app/(app)/decisions/DecisionQueue.tsx
const [isAdding, setIsAdding] = useState(false);
// Render: {isAdding && <Card><CardContent>...form...</CardContent></Card>}
// Button: <Button variant="outline" onClick={() => setIsAdding(true)}>+ New Category</Button>
```

### Pattern 3: Inline Edit on Existing Row (D-05, D-08)
**What:** Each row tracks its own `editingId` state. When a row's id matches, render input fields instead of display text.
**When to use:** In-place editing without a modal. Matches the approach from D-05/D-08.
**Example:**
```typescript
const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
// In accordion header: editingCategoryId === category.id ? <inputs> : <display text>
```

### Pattern 4: Accordion with Controlled Open State (D-02, D-03)
**What:** `openCategoryId` tracks which accordion is expanded; null means all collapsed.
**When to use:** Single-open accordion list (closes others when one opens — or multi-open, Claude's discretion).
**Example:**
```typescript
const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
// header onClick: setOpenCategoryId(prev => prev === id ? null : id)
// body: {openCategoryId === category.id && <ExpenseList ... />}
```

### Pattern 5: Server Action with Dual revalidatePath (BUDG-06)
**What:** Every budget mutation must invalidate both `/budget` and `/dashboard`.
**When to use:** Any `budget_categories` or `expenses` write.
**Example:**
```typescript
// Source: established in CONTEXT.md code_context
revalidatePath("/budget");
revalidatePath("/dashboard");
```

### Pattern 6: Wedding ID via wedding_members Join (not direct column)
**What:** Get `wedding_id` by querying `wedding_members` for the current user.
**When to use:** All INSERT actions need `wedding_id`.
**Example:**
```typescript
// Source: src/app/(app)/decisions/actions.ts
const { data: member } = await supabase
  .from("wedding_members")
  .select("wedding_id")
  .eq("user_id", user.id)
  .single();
if (!member) return { error: "No wedding found" };
```

### Anti-Patterns to Avoid
- **`getSession()` instead of `getUser()`:** Never use `getSession()` for auth checks — project enforces `getUser()` everywhere.
- **Direct Supabase calls in Client Components:** All DB access goes through server actions or server component fetches.
- **Inline Supabase queries in page.tsx:** All named query functions go in `actions.ts` (per project memory note).
- **Missing `revalidatePath('/dashboard')`:** Budget mutations must invalidate dashboard — forgetting this breaks BUDG-06.
- **`terracotta` color classes:** The palette migrated to sage green. Use `bg-sage-*`, `text-sage-*` never `terracotta-*`.
- **Arbitrary CSS variable syntax:** Use `bg-sage-600` not `bg-[--color-sage-600]` (established in Phase 2 decisions).
- **Throwing errors to the client:** Actions return `{ error?: string }` — never `throw` to client (rethrow `NEXT_REDIRECT` only).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency display | Custom formatter | `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` | Already used in dashboard/page.tsx; handles locale edge cases |
| Accordion behavior | Custom CSS toggle | `useState` open/close with conditional render | No shadcn Accordion needed — simple conditional render matches project style |
| Form validation | Custom validator | Inline `if (!value.trim())` guards + `return { error: "..." }` from action | Matches existing pattern; no Zod or react-hook-form used in this project |
| Optimistic totals | Manual state sync | `useOptimistic` for immediate feedback | Established in MilestoneGrid.tsx — use if instant feedback on totals matters |

**Key insight:** This phase has no novel infrastructure. The entire implementation is composition of patterns already proven in Phases 2–3.

---

## Schema Verification (CRITICAL)

The tables exist from Phase 1 migrations. **Before writing any migration**, verify live schema matches the types file. Key facts verified from migrations + supabase.ts:

### `budget_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| wedding_id | uuid FK → weddings | NOT NULL |
| name | text | NOT NULL |
| allocated_amount | numeric | NOT NULL DEFAULT 0 |
| created_at | timestamptz | nullable |

### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| budget_category_id | uuid FK → budget_categories | NOT NULL, ON DELETE CASCADE |
| vendor_name | text | NOT NULL |
| amount | numeric | NOT NULL |
| date | date | nullable |
| status | text | NOT NULL DEFAULT 'pending', CHECK IN ('pending','paid') |
| note | text | nullable |
| created_at | timestamptz | nullable |

**RLS status (verified from 20240101000004_rls_policies.sql):**
- `budget_categories`: SELECT, INSERT, UPDATE, DELETE — all scoped via `(SELECT get_my_wedding_id())`
- `expenses`: SELECT, INSERT, UPDATE, DELETE — all scoped via budget_category_id subquery to wedding

**Indexes (verified from 20240101000003_indexes.sql doc reference):**
- `budget_categories_wedding_id_idx` — exists
- `expenses_budget_category_id_idx` — exists

**Conclusion:** No schema migrations are needed for Phase 4 unless live verification reveals discrepancies. A `supabase gen types` run is not needed unless migrations are added.

---

## Common Pitfalls

### Pitfall 1: Forgetting `revalidatePath('/dashboard')` on budget mutations
**What goes wrong:** Dashboard budget cards go stale after budget page changes.
**Why it happens:** The dashboard fetches from `budget_categories` and `expenses` via Next.js server cache. Only `/dashboard` revalidation clears it.
**How to avoid:** All budget `actions.ts` mutations call both `revalidatePath("/budget")` and `revalidatePath("/dashboard")`.
**Warning signs:** Dashboard shows different totals than budget page after a mutation.

### Pitfall 2: Over-budget warning computed server-side only
**What goes wrong:** Warning doesn't appear immediately when user types a new allocated amount.
**Why it happens:** BUDG-02 requires an inline warning — it must update as the user interacts.
**How to avoid:** Compute the over-budget check client-side in the `BudgetClient` component, comparing `sum(categories.allocated_amount)` against `wedding.total_budget`. The server-fetched data is the initial state; optimistic or controlled state handles intermediate edits.

### Pitfall 3: Accordion close state lost when editing
**What goes wrong:** Inline category edit saves, accordion collapses unexpectedly.
**Why it happens:** `router.refresh()` re-renders the Server Component, resetting all client state including `openCategoryId`.
**How to avoid:** After a successful mutation, preserve `openCategoryId` — do not reset it. Only reset `editingCategoryId`. Use `router.refresh()` (not full navigation) so the client component re-receives props but keeps its own state across the refresh boundary where React can preserve it. Note: `router.refresh()` does re-mount some components — consider whether `useOptimistic` is preferable to avoid a full refresh on toggling.

### Pitfall 4: `status` field typed as free string
**What goes wrong:** TypeScript allows any string for expense status; UI renders unexpected values.
**Why it happens:** The DB type `status: string` is not narrowed in domain types.
**How to avoid:** Define `type ExpenseStatus = "paid" | "pending"` in `types/index.ts` and use it in domain interfaces for `Expense`.

### Pitfall 5: Spent total includes pending expenses
**What goes wrong:** BUDG-03 success criterion states "spent total equals sum of paid expenses only." The dashboard already filters correctly.
**Why it happens:** Easy to sum all expenses without the status filter.
**How to avoid:** Always filter: `.filter(e => e.status === "paid")` before summing amounts. Mirror the exact logic in `dashboard/page.tsx`.

### Pitfall 6: Delete without cascade awareness
**What goes wrong:** Deleting a category leaves orphan expenses, or errors on FK constraint.
**Why it happens:** `expenses.budget_category_id` has ON DELETE CASCADE — deleting a category automatically deletes its expenses. This is correct behavior but must be communicated to the user.
**How to avoid:** Delete confirmation should note that expenses will also be deleted. The DB cascade handles the actual cleanup.

---

## Code Examples

### Summary Bar (mirrors dashboard budget cards)
```typescript
// Source: src/app/(app)/dashboard/page.tsx
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

// Computed aggregates:
const totalBudget = wedding.total_budget ?? 0;
const allocated = categories.reduce((sum, c) => sum + (c.allocated_amount ?? 0), 0);
const spent = categories
  .flatMap(c => (c.expenses as Array<{ amount: number; status: string }> | null) ?? [])
  .filter(e => e.status === "paid")
  .reduce((sum, e) => sum + (e.amount ?? 0), 0);
const remaining = totalBudget - spent;
const isOverAllocated = allocated > totalBudget && totalBudget > 0;
```

### Over-budget warning (BUDG-02 — Claude's discretion on styling)
```typescript
// Placement: below summary bar, above category list
{isOverAllocated && (
  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
    Allocated amount exceeds total budget by {formatCurrency(allocated - totalBudget)}.
  </div>
)}
```

### Category create action pattern
```typescript
// Source: mirrors src/app/(app)/decisions/actions.ts
"use server";
export async function createCategory(name: string, allocatedAmount: number): Promise<{ error?: string }> {
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

    const { error } = await supabase.from("budget_categories").insert({
      wedding_id: member.wedding_id,
      name,
      allocated_amount: allocatedAmount,
    });
    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

### Paid vs pending visual treatment (BUDG-05 — Claude's discretion)
```typescript
// Recommended: badge approach — consistent with Open/Resolved badges in OptionList.tsx
<span className={
  expense.status === "paid"
    ? "text-xs px-2 py-0.5 rounded-full bg-sage-100 text-sage-700"
    : "text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
}>
  {expense.status === "paid" ? "Paid" : "Pending"}
</span>
```

### Domain types to add to `types/index.ts`
```typescript
export type ExpenseStatus = "paid" | "pending";

export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  allocated_amount: number;
  created_at: string | null;
}

export interface Expense {
  id: string;
  budget_category_id: string;
  vendor_name: string;
  amount: number;
  date: string | null;
  status: ExpenseStatus;
  note: string | null;
  created_at: string | null;
}

export interface CategoryWithExpenses extends BudgetCategory {
  expenses: Expense[];
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `terracotta` palette | `sage` palette | Quick task 260406-qvk | All new UI uses `bg-sage-*` / `text-sage-*` |
| `useFormState` | `useActionState` | Phase 1 (React 19 / Next.js 15) | Use `useActionState` if form-level state needed |
| `getSession()` | `getUser()` | Phase 1 | Auth check: always `getUser()` |

---

## Open Questions

1. **Should accordion state persist across refreshes?**
   - What we know: `router.refresh()` re-renders server data but can preserve client state if the component tree stays mounted.
   - What's unclear: Whether React's reconciler maintains `openCategoryId` across refresh calls in practice.
   - Recommendation: Test with `router.refresh()` first; if state resets, switch to `useOptimistic` for mutations so refresh can be avoided.

2. **Delete confirmation UX (Claude's discretion)**
   - What we know: Options are inline confirm ("Are you sure?" row), optimistic delete with undo toast, or immediate delete.
   - What's unclear: Which fits the project's simplicity bar.
   - Recommendation: Inline confirm on the row (toggle a "Delete?" confirmation state per row id). Avoids dependency on a toast library not currently installed.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code-only with no new external dependencies. All required tools (Supabase local stack, Next.js dev server) are already used by the project.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test scripts in package.json |
| Config file | None — Wave 0 gap |
| Quick run command | `npm run build && npx tsc --noEmit` (type-check + build as proxy for correctness) |
| Full suite command | `npm run build && npx tsc --noEmit && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUDG-01 | Category create form submits, appears in list | manual-only (no test framework) | `npm run build` (type safety gate) | ❌ Wave 0 |
| BUDG-02 | Over-budget warning appears when allocated > total | manual-only | `npm run build` | ❌ Wave 0 |
| BUDG-03 | Expense add form saves; appears in category | manual-only | `npm run build` | ❌ Wave 0 |
| BUDG-04 | Edit/delete updates expense list immediately | manual-only | `npm run build` | ❌ Wave 0 |
| BUDG-05 | Paid vs pending rows are visually distinct | manual-only (visual) | `npm run build` | ❌ Wave 0 |
| BUDG-06 | Dashboard totals match budget page after mutation | manual-only | `npm run build` | ❌ Wave 0 |

**Note:** No automated test framework is installed in this project. All behavioral verification is manual via Playwright MCP (per CLAUDE.md) or visual inspection. The build + type-check is the automated gate.

### Sampling Rate
- **Per task commit:** `npm run build && npx tsc --noEmit`
- **Per wave merge:** `npm run build && npx tsc --noEmit && npm run lint`
- **Phase gate:** Build green + manual UI verification via Playwright MCP before `/gsd:verify-work`

### Wave 0 Gaps
No test infrastructure gaps that block implementation — the project has no test framework. Manual verification via Playwright MCP is the documented approach (CLAUDE.md).

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 4 |
|-----------|-------------------|
| Server Components are default — fetch data directly, no hooks | `page.tsx` must be an async Server Component |
| Client Components only for interactivity | `BudgetClient` (and sub-components) are `"use client"` |
| Server actions return `{ error?: string }` — never throw to client | All actions.ts functions follow this shape |
| Auth checks use `getUser()` — never `getSession()` | Every server action and page fetch |
| DB types from `types/supabase.ts` (generated), domain types in `types/index.ts` | Add `BudgetCategory`, `Expense`, `CategoryWithExpenses` to index.ts |
| All Supabase queries in named functions in actions.ts — never inline in page.tsx | Page.tsx fetches inline data for Server Component reads are OK; named action functions for mutations |
| Supabase MCP must be confirmed connected before execute-phase | Verify live schema before any migration |
| `revalidatePath` after mutations | Always call for both `/budget` and `/dashboard` |
| Use sage color palette (`bg-sage-*`) | Never use `terracotta-*` classes |
| `supabase gen types typescript` after any migration | Required if a migration is added |
| Playwright MCP for UI verification | Use to verify all 5 success criteria after implementation |

---

## Sources

### Primary (HIGH confidence)
- `/Users/aaronwoo/claude/twogether/types/supabase.ts` — Verified exact columns and types for `budget_categories` and `expenses`
- `/Users/aaronwoo/claude/twogether/supabase/migrations/20240101000001_schema.sql` — Verified table DDL including CHECK constraints
- `/Users/aaronwoo/claude/twogether/supabase/migrations/20240101000004_rls_policies.sql` — Verified all RLS policies exist for both tables
- `/Users/aaronwoo/claude/twogether/src/app/(app)/dashboard/page.tsx` — Verified dashboard query shape and aggregate computation logic
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/DecisionQueue.tsx` — Verified inline form expansion pattern
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/[id]/OptionList.tsx` — Verified inline add-at-bottom pattern
- `/Users/aaronwoo/claude/twogether/src/app/(app)/dashboard/MilestoneGrid.tsx` — Verified `useOptimistic` + `useTransition` pattern
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/actions.ts` — Verified server action shape and wedding_id fetch pattern
- `/Users/aaronwoo/claude/twogether/CLAUDE.md` — Project constraints and coding conventions
- `/Users/aaronwoo/claude/twogether/docs/supabase.md` — RLS policy templates, migration workflow

### Secondary (MEDIUM confidence)
- `globals.css` color variable scan — confirmed sage palette active, no terracotta variables remain

---

## Metadata

**Confidence breakdown:**
- Schema: HIGH — verified from migrations and generated types; no guessing
- Standard stack: HIGH — no new libraries; everything from prior phases
- Architecture patterns: HIGH — directly traceable to existing files
- Pitfalls: HIGH — drawn from existing decisions log and code review
- Color palette: HIGH — confirmed via globals.css scan post-migration

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable stack — no fast-moving dependencies)

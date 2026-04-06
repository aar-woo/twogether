# Phase 3: Decision Queue + Voting — Research

**Researched:** 2026-03-24
**Domain:** Next.js 15 App Router, Supabase RLS, optimistic UI patterns, upsert voting
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Rating input UX**
- Control: 10 number buttons labeled 1–10 in a row; selected button highlights in terracotta
- Optional comment textarea below the buttons
- Explicit **Submit** button — no auto-save on selection
- Ratings are **mutable at any time** — re-submitting overwrites the previous vote and score recalculates. Implemented as upsert on `(option_id, user_id)`.

**Queue layout**
- `/decisions` — vertical list of clickable cards; clicking navigates to `/decisions/[id]`
- Queue card shows: decision title, open/resolved status chip, vote-status line ("3 options · You voted", "3 options · 87% top match", etc.)
- "+ New Decision" expands an **inline form** at the top of the queue (title + category fields + Submit); options are added from the detail page after creation
- Queue order is manually adjustable via **up/down buttons** on each card (no drag-to-reorder — v2)

**Decision detail page (`/decisions/[id]`)**
- Decision title as serif heading, category shown as a muted tag
- **Vertical list of option cards** — each option has its own card
- Option card states:
  - **Unvoted (current user):** shows 1–10 number buttons + comment textarea + Submit
  - **You voted, partner pending:** shows your rating/comment, "Waiting for partner" placeholder
  - **Both voted:** reveals both ratings (You: 8 · Partner: 7) + compatibility bar + score
- "+ Add option" inline form at the bottom of the option list (label field + Add button)
- "Select as winner" button on each option card — visible when decision is open; resolves the decision

**Compatibility score**
- Formula: `100 - (|ratingA - ratingB| × 10)` — measures alignment, not enthusiasm
- Queue card: shows best score across options once all voted options have both ratings (e.g. "87% top match")
- Detail page: each option card reveals a progress-bar-style badge below the ratings: `▉▉▉▉▉▉▉▉▉ 90% match`
- Score is computed in the application layer (not a DB computed column) — straightforward math on fetched vote rows

**Resolved decisions**
- Resolved decisions **stay in the queue** but sort to the bottom
- Queue card shows "Resolved" badge + winning option name in the subtitle line
- "Select as winner" button on the detail page resolves the decision (`status = 'resolved'`, sets `winning_option_id` or equivalent on the decision row)
- Either partner can resolve at any time — no voting requirement to resolve

### Claude's Discretion
- Exact progress bar implementation for the compatibility score (CSS width, color gradient, or solid terracotta fill)
- Loading/skeleton states on the detail page
- Error handling UI for failed vote submits
- Exact color for "Resolved" badge vs "Open" badge
- Whether up/down reorder buttons appear always or only on hover

### Deferred Ideas (OUT OF SCOPE)
- **Drag-to-reorder** — already v2 per project scope; up/down buttons cover v1
- **Rating mutability lock after both vote** — user considered this but decided to allow changes at any time; if this causes product issues, lock in v2
- **"Needs votes" count on dashboard** — could add a "X decisions awaiting your vote" badge on the dashboard; defer to Phase 7 polish
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DECI-01 | Either partner can create a decision with a title and category | Server action `createDecision`, inline form in DecisionQueue client component, `decisions` table INSERT with wedding-scoped RLS |
| DECI-02 | Either partner can add options to any decision at any time | Server action `addOption`, inline form in OptionList client component on detail page, `decision_options` INSERT |
| DECI-03 | Each partner can rate an option 1–10 with an optional comment | Server action `upsertVote` using ON CONFLICT DO UPDATE, RatingInput client component, `votes` table |
| DECI-04 | A partner's rating is hidden from the other until both have voted on that option | Already enforced at DB layer via `votes_select` RLS policy using EXISTS check — no application layer work needed |
| DECI-05 | Once both partners have voted, the compatibility score is displayed | Application-layer calc: `100 - (|ratingA - ratingB| × 10)`, triggered when fetched votes count == 2 for an option |
| DECI-06 | If only one partner has voted, only their rating is shown (no score) | Derived from vote count: 1 vote = show own rating + "Waiting for partner"; 2 votes = show both + score |
| DECI-07 | Either partner can resolve a decision by selecting a winning option | Server action `resolveDecision`, sets `status='resolved'` and `resolved_option_id` on the decision row |
| DECI-08 | Decision queue order persists and can be adjusted via up/down buttons | Server action `reorderDecision` swaps `sort_order` of adjacent decisions; `sort_order` column already in schema |
</phase_requirements>

---

## Summary

Phase 3 builds the decisions feature end-to-end on top of a schema that is already fully migrated. The `decisions`, `decision_options`, and `votes` tables all exist with RLS policies in place. The critical hidden-vote rule (DECI-04) is already enforced at the database layer — the application only needs to interpret what it receives: 0 votes = unvoted, 1 vote (own) = waiting for partner, 2 votes = reveal both and compute score.

The primary implementation surface is two routes: `/decisions` (queue page) and `/decisions/[id]` (detail page). Both follow the established project pattern — Server Components for reads, colocated `actions.ts` for writes, `useOptimistic` + `useTransition` for instant feedback in client components. The compatibility score is pure math in the application layer. Queue reordering is a swap of `sort_order` values via a server action.

The most nuanced area is correctly determining option card state from the vote data returned by Supabase. Because the RLS policy controls what rows come back, the application can derive state entirely from what is present: if only one vote exists and `vote.user_id === currentUserId` it's "you voted, partner pending"; if two votes exist it's "both voted, show score."

**Primary recommendation:** Build as three waves — (1) schema migration + type gen + domain types, (2) queue page with create/reorder/list, (3) detail page with options/voting/resolve.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15 | Server Components, server actions, dynamic routes | Already in project |
| Supabase JS (`@supabase/ssr`) | current | DB reads in Server Components, upsert in server actions | Already in project |
| shadcn/ui | current | `Card`, `Button`, `Input` primitives | Already in project |
| Tailwind v4 | current | Utility classes including terracotta palette | Already in project |
| TypeScript strict | current | Domain types in `types/index.ts` | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useOptimistic` | React 19 (bundled) | Instant local state before server action completes | All interactive mutations (vote, reorder, add) |
| React `useTransition` | React 19 (bundled) | Non-blocking action dispatch + pending state | Paired with useOptimistic in every client component |
| React `useState` | React 19 (bundled) | Inline form open/closed state, error messages | Local UI state not shared with server |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useOptimistic | SWR/React Query mutation | useOptimistic is native React 19, zero deps, already established in Phase 2 |
| App-layer compatibility score | DB computed column | App layer is simpler, no migration needed, formula is trivial |
| sort_order swap (server action) | Drag-to-reorder (dnd-kit) | User decided v1 = up/down buttons only; drag is v2 |

**Installation:** No new dependencies needed. All stack components already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/(app)/decisions/
├── page.tsx                    # Server Component — fetches decisions + vote summaries
├── DecisionQueue.tsx           # "use client" — queue list, inline new-decision form, reorder
├── DecisionCard.tsx            # "use client" or pure UI — single queue card
├── actions.ts                  # "use server" — createDecision, reorderDecision
└── [id]/
    ├── page.tsx                # Server Component — fetches decision + options + votes
    ├── OptionList.tsx          # "use client" — list of option cards, inline add-option form
    ├── OptionCard.tsx          # "use client" — handles vote form state, compatibility bar
    └── actions.ts              # "use server" — addOption, upsertVote, resolveDecision
```

### Pattern 1: Server Component Data Fetch with Relational Join

The queue page needs decisions plus a vote summary (has current user voted? what's the best score?). Fetch decisions with nested options and votes in one Supabase query. The RLS policy will only return votes the current user is entitled to see, so vote count per option is a safe signal.

```typescript
// src/app/(app)/decisions/page.tsx
// Source: established pattern from dashboard/page.tsx
export default async function DecisionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .maybeSingle();
  if (!wedding) redirect("/onboarding");

  const { data: decisions } = await supabase
    .from("decisions")
    .select(`
      id, title, category, status, sort_order, resolved_option_id,
      decision_options (
        id, label,
        votes ( id, user_id, rating )
      )
    `)
    .order("status", { ascending: true })         // open before resolved
    .order("sort_order", { ascending: true });

  return <DecisionQueue decisions={decisions ?? []} currentUserId={user.id} />;
}
```

**Note on ordering:** Open decisions first (alphabetical `open` < `resolved`), then by `sort_order`. This keeps resolved decisions at the bottom without a migration to add a `is_resolved` integer sort key.

### Pattern 2: Vote State Derivation from RLS-Filtered Rows

This is the central logic of the feature. Because the RLS policy only returns votes the current user can see:

```typescript
// Source: derived from RLS policy in supabase/migrations/20240101000004_rls_policies.sql
// votes_select: user can see own vote OR partner's vote if user has also voted

type VoteRow = { id: string; user_id: string; rating: number; comment?: string | null };

type OptionVoteState =
  | { state: "unvoted" }
  | { state: "you_voted"; myVote: VoteRow }
  | { state: "both_voted"; myVote: VoteRow; partnerVote: VoteRow; score: number };

function deriveOptionState(votes: VoteRow[], currentUserId: string): OptionVoteState {
  const myVote = votes.find(v => v.user_id === currentUserId);
  const partnerVote = votes.find(v => v.user_id !== currentUserId);

  if (!myVote) return { state: "unvoted" };
  if (!partnerVote) return { state: "you_voted", myVote };

  const score = 100 - Math.abs(myVote.rating - partnerVote.rating) * 10;
  return { state: "both_voted", myVote, partnerVote, score };
}
```

### Pattern 3: Upsert Vote (DECI-03, DECI-04)

Use Supabase `.upsert()` with `onConflict: 'option_id,user_id'` — this relies on the existing `UNIQUE(option_id, user_id)` constraint already in the schema.

```typescript
// src/app/(app)/decisions/[id]/actions.ts
"use server";

export async function upsertVote(
  optionId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("votes")
      .upsert(
        { option_id: optionId, user_id: user.id, rating, comment: comment || null },
        { onConflict: "option_id,user_id" }
      );

    if (error) return { error: error.message };

    revalidatePath(`/decisions/${/* decisionId */""}`);
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

**Pitfall:** `revalidatePath` in an action inside `[id]/actions.ts` needs the decision id. Pass it as a parameter or capture it in a closure with `bind`.

### Pattern 4: Queue Reorder (DECI-08)

Swap `sort_order` values between two adjacent decisions. Fetch the neighbor by finding the decision with the next/previous `sort_order` value.

```typescript
export async function reorderDecision(
  id: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Fetch current decision's sort_order
    const { data: current } = await supabase
      .from("decisions")
      .select("id, sort_order, status")
      .eq("id", id)
      .single();
    if (!current) return { error: "Decision not found" };

    // Find neighbor — same status, adjacent sort_order
    const { data: neighbor } = await supabase
      .from("decisions")
      .select("id, sort_order")
      .eq("status", current.status)
      .eq("sort_order", direction === "up"
        ? current.sort_order - 1
        : current.sort_order + 1
      )
      .maybeSingle();
    if (!neighbor) return {}; // already at top/bottom — no-op

    // Swap
    await supabase.from("decisions").update({ sort_order: neighbor.sort_order }).eq("id", id);
    await supabase.from("decisions").update({ sort_order: current.sort_order }).eq("id", neighbor.id);

    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

**Note:** Sort orders within resolved decisions and open decisions are independent buckets — swapping should only consider same-status neighbors.

### Pattern 5: Inline Form Toggle (established in MilestoneGrid)

Queue page and detail page both have inline create forms. Follow the same `useState` + `startTransition` pattern from `MilestoneGrid.tsx`:

```typescript
// "use client"
const [isAdding, setIsAdding] = useState(false);
const [, startTransition] = useTransition();

function handleAdd() {
  if (!title.trim()) { setIsAdding(false); return; }
  startTransition(async () => {
    const result = await createDecision(title.trim(), category);
    if (!result?.error) {
      setTitle("");
      setIsAdding(false);
    }
  });
}
```

### Pattern 6: Compatibility Bar (Claude's Discretion)

Recommend: CSS `width` percentage with solid terracotta fill. Simple, no animation library needed.

```typescript
// In OptionCard.tsx — both_voted state
function CompatibilityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-terracotta-500 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-terracotta-700 shrink-0">
        {score}% match
      </span>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Calling Supabase from a Client Component directly:** All DB reads happen in Server Components; all writes happen in server actions. Client components receive props and call server actions.
- **Using getSession() instead of getUser():** Always `supabase.auth.getUser()` — enforced throughout codebase.
- **Sort order gaps:** When creating a new decision, find the maximum `sort_order` among open decisions and add 1. Do not assume sequential integers.
- **Re-sorting optimistic state:** Per Phase 2 lesson, do not re-sort the optimistic list after mutations. Reorder visually only when the server response arrives via `revalidatePath`.
- **Nested useOptimistic for option cards:** Each OptionCard manages its own local vote state with `useState`, not `useOptimistic` — the optimistic update is the local form state itself, and `revalidatePath` refreshes the Server Component on success.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upsert on conflict | Manual SELECT + INSERT/UPDATE | Supabase `.upsert({ onConflict })` | Atomic, race-condition safe |
| Vote visibility enforcement | App-layer gate checking partner vote | Existing `votes_select` RLS policy | DB enforces it; app just reads what it receives |
| Auth check in every action | Custom session middleware | `supabase.auth.getUser()` at top of every action | Already established pattern |
| Type-safe DB rows | Manual interface | `types/supabase.ts` generated types + `types/index.ts` domain types | Consistency, generated from live schema |

**Key insight:** The hardest part of this feature (hidden votes) is already solved at the DB layer. The application trusts what Supabase returns and derives UI state from row presence/absence.

---

## Common Pitfalls

### Pitfall 1: revalidatePath Scope
**What goes wrong:** `revalidatePath("/decisions")` on the queue page does not revalidate the detail page. Voting on an option requires `revalidatePath(\`/decisions/${decisionId}\`)`.
**Why it happens:** Next.js cache keys are per-path. The detail page and queue page are separate cache entries.
**How to avoid:** Pass `decisionId` as a parameter to `upsertVote` and `addOption` actions; use it in `revalidatePath`.
**Warning signs:** Vote submits successfully (no error) but UI does not update after revalidation.

### Pitfall 2: Sort Order Collision on Create
**What goes wrong:** Two partners create decisions simultaneously and both get `sort_order = N`, causing a tie.
**Why it happens:** Fetching max sort_order and incrementing is a read-then-write race.
**How to avoid:** For v1, this is acceptable — ties resolve consistently via `created_at` secondary sort. Do not add a DB trigger or transaction for this; it is over-engineering for two users.
**Warning signs:** Two decisions appear at the same visual position after simultaneous creates (rare in practice with two users).

### Pitfall 3: Reorder Neighbor Not Found
**What goes wrong:** Clicking "up" on the top-most open decision finds no neighbor and throws.
**Why it happens:** `.maybeSingle()` returns `null` when no row found; calling `.single()` would throw.
**How to avoid:** Use `.maybeSingle()` for neighbor lookup; treat `null` result as a no-op. Disable the "up" button on the first card and "down" button on the last card to prevent the call.
**Warning signs:** Server action returns error or throws on boundary decisions.

### Pitfall 4: Resolved Decision Sort Order Mixing with Open
**What goes wrong:** Resolved decisions interleave with open ones when reordering.
**Why it happens:** `sort_order` is a single integer namespace across all statuses.
**How to avoid:** The queue page should fetch ordered by `status ASC` first (open < resolved alphabetically), then `sort_order ASC`. The reorder action must only swap neighbors of the same `status` value.
**Warning signs:** Clicking "down" on last open decision swaps it with first resolved decision.

### Pitfall 5: Compatibility Score on Partial Votes
**What goes wrong:** Score is displayed when only one partner has voted.
**Why it happens:** Developer computes score whenever `votes.length > 0`.
**How to avoid:** Only compute and display score when `votes.length === 2`. The RLS policy means if only your vote is returned, you cannot see the partner's rating, so there is nothing to compute.
**Warning signs:** Score bar appears below an option card when partner has not yet voted.

### Pitfall 6: Missing `winning_option_id` Column
**What goes wrong:** `resolveDecision` action tries to set `winning_option_id` but the column does not exist (or is named `resolved_option_id` in schema).
**Why it happens:** The Phase 1 schema uses `resolved_option_id`, not `winning_option_id`. The CONTEXT.md refers to "winning_option_id" but the actual migration column is `resolved_option_id`.
**How to avoid:** Verify live schema via Supabase MCP before writing migration. The existing `resolved_option_id uuid` column in `decisions` may already cover the need — confirm if it has a FK to `decision_options`.
**Warning signs:** Migration fails or upsert returns column-not-found error.

---

## Code Examples

### Create Decision (DECI-01)
```typescript
// src/app/(app)/decisions/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDecision(
  title: string,
  category: string
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

    // Find max sort_order among open decisions
    const { data: last } = await supabase
      .from("decisions")
      .select("sort_order")
      .eq("wedding_id", member.wedding_id)
      .eq("status", "open")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = last ? last.sort_order + 1 : 1;

    const { error } = await supabase.from("decisions").insert({
      wedding_id: member.wedding_id,
      title,
      category: category || null,
      status: "open",
      sort_order: sortOrder,
    });

    if (error) return { error: error.message };
    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

### Resolve Decision (DECI-07)
```typescript
// src/app/(app)/decisions/[id]/actions.ts
export async function resolveDecision(
  decisionId: string,
  winningOptionId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("decisions")
      .update({ status: "resolved", resolved_option_id: winningOptionId })
      .eq("id", decisionId);

    if (error) return { error: error.message };
    revalidatePath(`/decisions/${decisionId}`);
    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}
```

### Domain Types to Add (types/index.ts)
```typescript
// Add to types/index.ts after Milestone and WeddingMember

export interface Decision {
  id: string;
  wedding_id: string;
  title: string;
  category: string | null;
  status: "open" | "resolved";
  resolved_option_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DecisionOption {
  id: string;
  decision_id: string;
  label: string;
  created_at: string;
}

export interface Vote {
  id: string;
  option_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Enriched types for page data
export interface OptionWithVotes extends DecisionOption {
  votes: Vote[];
}

export interface DecisionWithOptions extends Decision {
  decision_options: OptionWithVotes[];
}
```

---

## Schema Verification Needed

Before writing the migration, use Supabase MCP to confirm live state:

1. Does `decisions.resolved_option_id` have a FK constraint to `decision_options(id)`? The Phase 1 migration defines it as `uuid` with no FK — the FK needs to be added or the column was intended as a loose reference.
2. Does `votes` already have the `UNIQUE(option_id, user_id)` constraint? The Phase 1 migration includes `UNIQUE (option_id, user_id)` — verify this exists in the live schema before adding it in a new migration.
3. Does `decisions.sort_order` already exist? Phase 1 schema includes it with `NOT NULL DEFAULT 0` — confirm it is present.

**Expected finding:** `sort_order` and `UNIQUE(option_id, user_id)` are already in place. The `resolved_option_id` FK may be missing. A Phase 3 migration should add only what is missing.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` | `useActionState` | React 19 / Next.js 15 | Use `useActionState` for form-bound server actions (established in Phase 1) |
| `getSession()` | `getUser()` | Supabase SSR guidance | `getUser()` verifies server-side; never trust `getSession()` cookies alone |
| Manual vote hide logic in app | RLS `EXISTS` subquery | Phase 1 design decision | DB enforces vote visibility; application just reads results |

---

## Open Questions

1. **Does `resolved_option_id` need a FK constraint?**
   - What we know: Phase 1 migration defines it as `uuid` with no `REFERENCES` clause
   - What's unclear: Whether the lack of FK is intentional (loose reference) or an oversight
   - Recommendation: Add `REFERENCES decision_options(id)` FK in Phase 3 migration for data integrity. Use `ON DELETE SET NULL` so deleting a winning option reopens the decision gracefully.

2. **How does the queue page sort open vs. resolved?**
   - What we know: Resolved stay in queue but sort to bottom; no `is_resolved integer` sort column exists
   - What's unclear: Whether ordering by `status ASC` (alphabetical: "open" < "resolved") then `sort_order ASC` is reliable
   - Recommendation: This works for the two-value enum. Document it as a pattern decision in STATE.md after execution.

3. **Queue card "best score" computation**
   - What we know: Show "87% top match" when votes are visible for at least one option
   - What's unclear: What to show if some options have both votes and others don't
   - Recommendation: Compute max compatibility score across all options that have exactly 2 visible votes. If zero such options exist, show "X options · You voted" or "X options · Not yet voted".

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files or test directories found |
| Config file | None — Wave 0 gap |
| Quick run command | N/A — no test framework |
| Full suite command | N/A — no test framework |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DECI-01 | Create decision with title + category | manual (Playwright) | — | Wave 0 gap |
| DECI-02 | Add option to decision | manual (Playwright) | — | Wave 0 gap |
| DECI-03 | Rate option 1–10, submit vote | manual (Playwright) | — | Wave 0 gap |
| DECI-04 | Partner rating hidden until both vote | manual (Playwright) | — | Wave 0 gap |
| DECI-05 | Compatibility score shown when both voted | manual (Playwright) | — | Wave 0 gap |
| DECI-06 | Only own rating shown when partner pending | manual (Playwright) | — | Wave 0 gap |
| DECI-07 | Resolve decision by selecting winner | manual (Playwright) | — | Wave 0 gap |
| DECI-08 | Queue order persists, up/down buttons work | manual (Playwright) | — | Wave 0 gap |

**Note on test approach:** No automated test infrastructure exists in this project. All verification uses Playwright MCP for visual/interactive checks and the Supabase MCP for RLS policy validation via SQL. This matches the project's verification pattern from Phases 1 and 2.

### Sampling Rate
- **Per task commit:** Manual review via browser + Playwright MCP spot-check
- **Per wave merge:** Playwright MCP full flow walkthrough
- **Phase gate:** Full decision flow verified (create, add options, both partners vote, score revealed, resolve) before `/gsd:verify-work`

### Wave 0 Gaps
None requiring test framework installation. Project uses MCP-based verification, not automated unit tests.

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20240101000001_schema.sql` — live schema for decisions, decision_options, votes tables
- `supabase/migrations/20240101000004_rls_policies.sql` — RLS policies including votes_select visibility rule
- `src/app/(app)/dashboard/MilestoneGrid.tsx` — established useOptimistic + useTransition pattern
- `src/app/(app)/dashboard/actions.ts` — canonical server action pattern with error handling
- `src/app/(app)/dashboard/page.tsx` — Server Component data fetch with maybeSingle redirect pattern
- `docs/supabase.md` — RLS scalar subquery pattern, upsert, migration workflow

### Secondary (MEDIUM confidence)
- `.planning/phases/03-decision-queue-voting/03-CONTEXT.md` — user decisions (source of truth for feature spec)
- `.planning/STATE.md` — project decisions log, Phase 2 lessons (Tailwind utility classes, maybeSingle, no re-sort of optimistic state)

### Tertiary (LOW confidence)
None — all findings are verified against project source files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, patterns verified in source
- Architecture: HIGH — follows established project patterns exactly
- Schema verification: MEDIUM — schema files match expectations but live DB should be confirmed via Supabase MCP before migration
- Pitfalls: HIGH — derived from actual Phase 1/2 lessons documented in STATE.md and source code

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable stack — no fast-moving dependencies)

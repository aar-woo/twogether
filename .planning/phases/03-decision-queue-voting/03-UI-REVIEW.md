# Phase 03 — UI Review

**Audited:** 2026-03-31
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md for this phase)
**Screenshots:** Not captured (dev server redirects unauthenticated Playwright session to /login; code-only audit performed)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Copy is specific and contextual; two generic "Submit" / "Cancel" labels remain in the queue create form |
| 2. Visuals | 3/4 | Clear card-based hierarchy; Up/Down reorder buttons lack icon affordance and no loading feedback during mutations |
| 3. Color | 4/4 | Terracotta accent used on exactly 3 targeted elements; no hardcoded hex/rgb values |
| 4. Typography | 4/4 | 3 font sizes (xs, sm, 2xl) and 3 weight variants (medium, semibold, serif) — well within scale |
| 5. Spacing | 4/4 | Consistent Tailwind scale values throughout; no arbitrary px/rem overrides |
| 6. Experience Design | 2/4 | Vote submit error handling present but add-option and reorder errors are silently swallowed; debug console.log left in production code; no confirmation before "Select as winner" (irreversible action) |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **`console.log("decision: ", decision)` left in DecisionCard.tsx line 74** — exposes full decision+votes object to browser DevTools in production, leaks partner vote data before the RLS reveal moment — remove the statement before any production deployment.

2. **"Select as winner" resolves without confirmation** — resolving a decision is irreversible from the UI (no undo flow exists); a misclick locks the decision — add a shadcn `AlertDialog` confirmation: "Mark [option label] as the winner? This will resolve the decision." with Confirm / Cancel actions.

3. **Compatibility score formula does not match the product spec** — `03-CONTEXT.md` defines `100 - (|ratingA - ratingB| × 10)` but both `OptionCard.tsx` (line 17–21) and `DecisionCard.tsx` (lines 44–48) implement `Math.round(avg * 10)` with bonus/penalty multipliers — the displayed percentages and the spec's worked examples (both vote 8 → 100%, one 7 one 8 → 90%) will not match, breaking the couple's mental model of "alignment not enthusiasm."

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Passing:**
- Vote CTAs are specific: "Submit vote" / "Update vote" (OptionCard.tsx:113) — context-aware, not generic.
- "Waiting for partner..." (OptionCard.tsx:144) is evocative and on-brand.
- "Select as winner" (OptionCard.tsx:188) is clear about the action.
- Empty state copy is complete: "No decisions yet. Create your first one above." and "No options yet. Add the first one below."
- Error text uses `result.error` directly from the server (OptionCard.tsx:107) — could expose raw Supabase error strings but is better than hiding errors silently.

**Issues:**
- `DecisionQueue.tsx:81` — "Submit" is a generic label on the new-decision form's primary action. Prefer "Add decision" to match the context.
- `DecisionQueue.tsx:84` and `OptionList.tsx:120` — "Cancel" is fine as a secondary action label; acceptable here, not flagged as a blocker.
- Queue card reorder buttons (DecisionCard.tsx:106, 115) are labeled "Up" and "Down" — functional but could be replaced with chevron icons with `aria-label` for visual polish.

---

### Pillar 2: Visuals (3/4)

**Passing:**
- Card-based hierarchy is consistent across queue and detail pages — `Card` + `CardContent p-4` used uniformly.
- Status chips use distinct color coding: green-100/green-700 for Open, amber-100/amber-700 for Resolved — immediately scannable.
- Decision title on detail page uses `font-serif text-2xl` (Playfair Display) as the focal point, establishing the hierarchy.
- Winner badge on OptionCard reuses the amber chip pattern, creating visual consistency with the Resolved state.
- CompatibilityBar uses a progress bar with a smooth `transition-all duration-500` — the key emotional reveal moment has appropriate visual weight.
- Back link `← All Decisions` (OptionList.tsx:57-63) is understated but clear; good use of hover transition.

**Issues:**
- "Up" / "Down" text buttons (DecisionCard.tsx:106-118) look like secondary content, not control affordances. No icon (chevron-up/down) to visually distinguish them from text labels. Users may not immediately recognize them as drag-like reorder controls.
- `useTransition` is used for createDecision and reorderDecision, but the transition `isPending` is not consumed — the UI has no visual feedback (spinner, opacity change, button disabled state) while mutations are in-flight. The queue can feel frozen during the ~300ms server round-trip.
- `OptionCard` vote form: the 10 number buttons are in a `flex-wrap gap-1` row. At narrow viewport widths (mobile) a button could wrap to a third line, breaking the intended single-row affordance. No `min-w-` or `w-8` constraint is set on each button.

---

### Pillar 3: Color (4/4)

**Passing:**
- Terracotta accent used exactly 3 times — all on semantically appropriate elements:
  - `bg-terracotta-500` on CompatibilityBar fill (the score reveal).
  - `text-terracotta-700` on the score percentage label.
  - `bg-terracotta-500 hover:bg-terracotta-600` on the selected rating button state.
- No hardcoded `#hex` or `rgb()` values anywhere in the decisions feature.
- Status chips (green-100/green-700, amber-100/amber-700) use Tailwind semantic colors, not custom values.
- All other color usage references design tokens: `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `text-destructive`.

No issues found.

---

### Pillar 4: Typography (4/4)

**Passing:**
- Font sizes in use: `text-xs` (status chips), `text-sm` (vote-status summaries, metadata), `text-2xl` (page headings) — 3 distinct sizes, well within a 4-size ceiling.
- Font weights in use: `font-medium` (option labels), `font-semibold` (decision titles in cards), `font-serif` (page h1 headings) — 3 weight variants with clear hierarchy function.
- The combination of serif for headings and default sans-serif for body text aligns with the app's wedding-editorial aesthetic established in earlier phases.

No issues found.

---

### Pillar 5: Spacing (4/4)

**Passing:**
- Spacing follows a consistent small-medium scale: `gap-1`, `gap-2`, `gap-3`, `gap-4`, `mt-1`, `mt-2`, `mt-3`, `mb-1`, `mb-3`, `mb-4`, `mb-6`, `py-8`, `py-16`.
- No arbitrary `[px]` or `[rem]` values found.
- Inner card padding is uniformly `p-4` across all card instances.
- The outer container consistently uses `max-w-2xl mx-auto` on both queue and detail pages, providing a 2/3-width centered reading column against the layout's `max-w-5xl`.
- `space-y-3` used consistently within form stacks.

No issues found.

---

### Pillar 6: Experience Design (2/4)

**Passing:**
- Vote submit error is captured in state and rendered via `text-destructive` (OptionCard.tsx:107) — server errors do reach the user.
- Submit button is disabled when no rating is selected or while `isPending` (OptionCard.tsx:110) — prevents double-submit on the vote form.
- Boundary buttons disabled at list edges: `disabled={isFirst}` and `disabled={isLast}` (DecisionCard.tsx:101, 112).
- Empty states for both the queue and the options list are handled.
- Auth and wedding guards with proper redirects on both server pages.

**Issues:**

**Critical: `console.log` debug statement in production code**
- `DecisionCard.tsx:74` — `console.log("decision: ", decision)` logs the full `DecisionWithOptions` object including the `votes` array. In a two-sided voting scenario, if a developer has both users' sessions open in the same browser (DevTools), the partner's vote data would be visible in the console, bypassing the RLS-based reveal timing. Remove before any production build.

**High: No confirmation before resolve**
- `OptionList.tsx:46-49` — `handleResolve` calls `resolveDecision` immediately on button click with no confirmation step. Resolving a decision is functionally irreversible from the current UI (no reopen action exists). A misclick on "Select as winner" would lock the decision. An `AlertDialog` from shadcn/ui is already available in the component library and would cover this.

**Medium: add-option and reorder errors are silently discarded**
- `DecisionQueue.tsx:34` — `if (!result?.error) { ... }` on `createDecision` succeeds silently but does not show the user what went wrong if the action returns an error. Same pattern in `OptionList.tsx:33` for `addOption` and `OptionList.tsx:47` for `resolveDecision`. Only the vote form (OptionCard) displays errors. A toast notification or inline error state should be added for the other mutations.

**Medium: Transition pending state not surfaced in UI**
- `DecisionQueue.tsx:22` — `const [, startTransition] = useTransition()` discards the `isPending` boolean. The reorder buttons have no visual feedback while the server action runs. At minimum the buttons could be `disabled` during transition to prevent double-invocation and signal to the user that work is happening.

**Low: No keyboard submit on new decision form**
- `DecisionQueue.tsx` — the title/category `Input` components have no `onKeyDown` handler for Enter to submit. The detail page's add-option `Input` (OptionList.tsx:111-114) correctly handles Enter and Escape, but the queue-level form lacks this affordance.

---

## Registry Safety

Registry audit: 0 third-party blocks — components.json contains no third-party registries. Only the shadcn official Textarea component was added during this phase (`src/components/ui/textarea.tsx`). No flags.

---

## Files Audited

- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/page.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/actions.ts`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/DecisionQueue.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/DecisionCard.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/[id]/page.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/[id]/actions.ts`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/[id]/OptionCard.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/decisions/[id]/OptionList.tsx`
- `/Users/aaronwoo/claude/twogether/src/app/(app)/layout.tsx` (layout/padding context)
- `/Users/aaronwoo/claude/twogether/components.json` (registry audit)

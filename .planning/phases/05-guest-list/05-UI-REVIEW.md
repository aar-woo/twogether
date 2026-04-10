# Phase 05 — UI Review

**Audited:** 2026-04-09
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md)
**Screenshots:** Not captured (auth wall — /guests redirects unauthenticated requests to /login)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Specific empty state and CTAs; "Yes"/"No" invited toggle labels lack context in isolation |
| 2. Visuals | 3/4 | Delete confirmation breaks grid layout; no loading feedback during mutations |
| 3. Color | 3/4 | Mixed raw sage tokens and shadcn semantic tokens; dual-system creates future drift risk |
| 4. Typography | 4/4 | 3 sizes, 4 weights, all purposeful — within standard range |
| 5. Spacing | 4/4 | Consistent Tailwind scale throughout; no arbitrary spacing values |
| 6. Experience Design | 2/4 | isPending acquired but voided — zero visual feedback during async mutations |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **isPending voided instead of used** — Users get no feedback that an action is in flight; fast-clicking can trigger duplicate mutations — Remove `void isPending` at `GuestClient.tsx:43`, use `isPending` to disable action buttons and add a visual indicator (opacity-50 on pending row, or spinner on the Add/Save button)

2. **Delete confirmation breaks table grid** — The delete row switches from `grid grid-cols-[1fr_100px_120px_80px_80px]` to `flex`, causing the row to visually jump width and misalign with neighboring rows — Keep the same grid on the delete confirmation row, placing the confirmation text in the first column and buttons in the last, matching the table's visual rhythm

3. **Mixed color token systems** — Normal rows use `text-sage-900`, `text-sage-600` (raw palette), while Card content uses `text-foreground`, `text-muted-foreground` (CSS variables) — either system alone is fine but mixing them means a future theme change (dark mode, rebranding) will require touching both layers — Standardize to semantic tokens (`text-foreground`, `text-muted-foreground`) in all table row cells, since the design system already defines these via `--foreground: #1E3325`

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

Strengths:
- Empty state is specific and actionable: "No guests yet. Click '+ Add Guest' to get started." (`GuestClient.tsx:349`) — passes UX best practice
- CTA label "+ Add Guest" is descriptive, not generic "Add"
- Delete confirmation uses the guest's name: `Delete "John"?` — contextual and clear
- Error dismiss button has `aria-label="Dismiss error"` — accessible

Issues:
- The invited quick-toggle in table rows shows only "Yes" / "No" (`GuestClient.tsx:492-493`). A user unfamiliar with the column header might not immediately know what Yes/No means if they glance at a row in isolation. The add-form version correctly shows "Invited" / "Not Invited" (`GuestClient.tsx:329-330`) — this inconsistency is minor but the table row labels could be "Yes" / "No" with a tooltip or "Invited" / "Uninvited"
- "Cancel" and "Save" are generic but are contextually appropriate in a table CRUD row — not flagged as a problem

### Pillar 2: Visuals (3/4)

Strengths:
- Clear page hierarchy: h1 "Guest List" with font-serif at text-2xl, summary cards at text-2xl/font-semibold for numbers, table body at text-sm
- Icon-only action buttons (Pencil, Trash2) both have aria-labels (`GuestClient.tsx:496, 503`)
- Hover state on table rows (`hover:bg-sage-50`) provides clear interaction affordance
- Summary cards above the table give quick at-a-glance counts before scanning rows

Issues:
- Delete confirmation row (`GuestClient.tsx:372-397`) breaks from `grid grid-cols-[1fr_100px_120px_80px_80px]` to `flex items-center justify-between`. This causes a visual layout jump — the row widens/reflows relative to the grid rows above and below it
- No visual feedback during pending mutations. `isPending` from `useTransition` is obtained at line 42 then immediately suppressed with `void isPending` at line 43. During the server roundtrip (create/update/delete), the UI shows no spinner, opacity change, or disabled state beyond the Save/Add button's `disabled={!name.trim()}` check (which doesn't activate during submission)
- The "By Side" and "By Relationship" summary cards show a dash ("—") when empty rather than a zero count — this is slightly inconsistent with the Total Guests card which always shows a number. Consider showing "0" or "—" consistently across all four cards

### Pillar 3: Color (3/4)

Strengths:
- No hardcoded hex or rgb values in the component
- Accent (sage-500 / primary) used appropriately: primary action button, invited "Yes" badge — not scattered decoratively
- Destructive red (`bg-red-50`, `text-red-700`) on error banner follows convention

Issues:
- Dual token system in use. Table row cells use raw sage palette tokens: `text-sage-900` (line 480), `text-sage-600` (lines 481-482), `text-sage-500` (line 357), `bg-sage-50` (line 478), `bg-sage-500` (lines 322, 447), `bg-sage-200` (lines 323, 448), `text-sage-700` (lines 323, 448). Card content uses shadcn semantic tokens: `text-muted-foreground`, `text-foreground`. This works today because `--foreground: #1E3325` and sage-900 are visually close, but they are not the same value and will diverge under any theme change
- `border-sage-200` used for the table header divider (`GuestClient.tsx:357`) and `border-sage-500` used for the invited badge border — mixing named palette with semantic tokens. The semantic equivalent would be `border-border` for the divider

Sage color usage distribution:
- bg-sage-200: 3 uses (invited "No" state)
- bg-sage-500: 3 uses (invited "Yes" state, add button)
- border-sage-200: 3 uses (table divider, badge border)
- text-sage-500: 2 uses (table header, empty state)
- text-sage-600: 2 uses (table cell secondary text)
- text-sage-900: 2 uses (table cell primary text)

### Pillar 4: Typography (4/4)

Font sizes in use (3 total — well within the 4-size limit):
- `text-xs` — summary card labels ("Total Guests", "Invited" etc.)
- `text-sm` — table body text, form labels, error banner
- `text-2xl` — summary card numbers, page h1 (paired with font-bold)

Font weights in use (4 total — at the limit but all purposeful):
- `font-normal` — summary card label text
- `font-medium` — table header row, guest name in row
- `font-semibold` — summary card numbers
- `font-bold` — page h1

The h1 correctly uses `font-serif text-2xl font-bold text-sage-900` (`GuestClient.tsx:178`) as established by the project design system. No rogue font sizes or weights introduced.

### Pillar 5: Spacing (4/4)

Spacing class distribution (top uses):
- `px-4` — 8 uses (card padding)
- `px-2` — 8 uses (table row/header horizontal padding)
- `gap-*` — 8 uses (flex and grid gaps)
- `space-y-*` — 4 uses (vertical stack spacing)
- `py-1`, `pt-4`, `pb-4`, `pb-1` — 4 uses each (card section padding)

All spacing values are from the Tailwind scale (p-1, p-3, p-4, px-2, px-3, px-4, py-1, py-2, py-3, pb-1, pb-2, pb-4, pt-4, gap-1, gap-2, gap-3, gap-4, space-y-0, space-y-0.5, space-y-6, py-12).

The grid column template `grid-cols-[1fr_100px_120px_80px_80px]` (`GuestClient.tsx:357, 404, 478`) uses arbitrary values, but this is the correct usage — it's a layout dimension, not a spacing token, and is used consistently in 3 places.

No arbitrary px or rem spacing values found.

### Pillar 6: Experience Design (2/4)

Implemented correctly:
- Error state: All four mutation handlers (create, update, delete, toggle) call `setError(result.error)` on failure (`GuestClient.tsx:99-100, 129-130, 142-143, 157`). Error banner is dismissible with an X button
- Empty state: Covered at `GuestClient.tsx:347-351` with specific copy and shown only when no guests exist and the add form is hidden
- Destructive confirmation: Delete requires a two-step confirmation (Trash click → "Delete X?" → Confirm button) before executing
- Disabled state: Add button is disabled when `newName.trim() === ""` (line 333); Save button likewise (line 457)
- Accessibility: Icon-only buttons have aria-labels; error dismiss button has aria-label

Notable gaps:
- **No loading feedback during async mutations**: `isPending` from `useTransition` is captured but voided at line 43 (`void isPending`). During the server roundtrip for createGuest, updateGuest, deleteGuest (network latency), there is no spinner, row opacity change, or disabled state on buttons. A user on a slow connection could click Add multiple times before the first request completes
- **No error boundary**: No React ErrorBoundary wrapping GuestClient. An unhandled render error will show a blank page with no recovery path. This is a React-level concern, not just optimistic state errors
- **No keyboard navigation for table rows**: Edit mode is triggered by mouse click on Pencil icon. There is no keyboard shortcut or focus management to return focus to the row after editing completes

---

## Registry Safety

Registry audit: 0 third-party registries in components.json (`"registries": {}`). All shadcn components are from the official registry. No registry flags to report.

---

## Files Audited

- `/Users/aaronwoo/claude/twogether/src/app/(app)/guests/GuestClient.tsx` (327 lines — primary audit target)
- `/Users/aaronwoo/claude/twogether/src/app/(app)/guests/page.tsx` (28 lines)
- `/Users/aaronwoo/claude/twogether/src/app/(app)/guests/actions.ts` (111 lines)
- `/Users/aaronwoo/claude/twogether/src/app/(app)/layout.tsx` (nav structure)
- `/Users/aaronwoo/claude/twogether/src/app/globals.css` (design token definitions)
- `/Users/aaronwoo/claude/twogether/components.json` (registry configuration)

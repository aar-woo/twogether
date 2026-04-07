---
phase: quick
plan: 260406-qvk
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/globals.css
  - src/app/(app)/dashboard/MilestoneCard.tsx
  - src/app/(app)/dashboard/MilestoneGrid.tsx
  - src/app/(app)/decisions/[id]/OptionCard.tsx
autonomous: true
requirements: [COLOR-MIGRATION]

must_haves:
  truths:
    - "No remaining terracotta references in src/app/ or src/components/"
    - "Primary buttons and accents render sage green"
    - "Status badges (green/amber) unchanged"
    - "Focus rings and hover states use sage colors"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Sage color palette replacing terracotta in @theme inline block and shadcn variable overrides"
      contains: "--color-sage-"
    - path: "src/app/(app)/dashboard/MilestoneCard.tsx"
      provides: "Sage classes on milestone badges"
      contains: "bg-sage-"
    - path: "src/app/(app)/decisions/[id]/OptionCard.tsx"
      provides: "Sage classes on vote buttons and progress bars"
      contains: "bg-sage-"
  key_links: []
---

<objective>
Migrate the app's primary accent color from terracotta to sage green.

Purpose: Visual rebrand — terracotta palette replaced with sage green across all theme definitions and component classes.
Output: Updated globals.css with sage palette, all component files using sage- classes instead of terracotta-.
</objective>

<execution_context>
@/Users/aaronwoo/claude/twogether/.claude/get-shit-done/workflows/execute-plan.md
@/Users/aaronwoo/claude/twogether/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-decision-queue-voting/COLOR_MIGRATION.md
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace terracotta palette with sage in globals.css</name>
  <files>src/app/globals.css</files>
  <action>
In `src/app/globals.css`, make these changes:

1. In the `@theme inline` block (lines 13-21), replace the terracotta palette with sage:
   - Change comment from "Terracotta palette" to "Sage green palette"
   - Replace all `--color-terracotta-*` variables with `--color-sage-*` using these hex values:
     ```
     --color-sage-50:  #EAF4EC;
     --color-sage-100: #C8E3CC;
     --color-sage-200: #A8D4B3;
     --color-sage-300: #80B890;
     --color-sage-400: #5E9B6D;
     --color-sage-500: #4A8059;
     --color-sage-600: #3D6B4A;
     --color-sage-700: #2C4A35;
     ```
   - Note: The spec uses hex values, not oklch. Use hex as specified.

2. In the `:root` block (lines 70-103), update shadcn variable overrides to use sage-equivalent colors:
   - `--primary`: change from `oklch(60% 0.14 35)` to `#4A8059` (sage-500 equivalent — primary action color)
   - `--primary-foreground`: change to `#EAF4EC` (sage-50 — text on primary)
   - `--foreground`: change to `#1E3325` (sage-800 — main text, dark green)
   - `--card-foreground`: same as foreground `#1E3325`
   - `--popover-foreground`: same as foreground `#1E3325`
   - `--secondary`: change to `#C8E3CC` (sage-100)
   - `--secondary-foreground`: change to `#1E3325` (sage-800)
   - `--muted-foreground`: change to `#3D6B4A` (sage-600)
   - `--accent`: change to `#C8E3CC` (sage-100)
   - `--accent-foreground`: change to `#1E3325` (sage-800)
   - `--ring`: change to `#4A8059` (sage-500)
   - `--sidebar-primary`: change to `#4A8059` (sage-500)
   - `--sidebar-primary-foreground`: change to `#EAF4EC` (sage-50)
   - `--sidebar-accent`: change to `#C8E3CC` (sage-100)
   - `--sidebar-accent-foreground`: change to `#1E3325` (sage-800)
   - `--sidebar-ring`: change to `#4A8059` (sage-500)
   - Leave `--background`, `--muted`, `--sidebar`, `--border`, `--input` warm off-white tones as-is (neutral, not branded)
   - Leave `--destructive` and all `--chart-*` as-is

3. Update the comment on line 69 from "terracotta brand identity" to "sage green brand identity".

Do NOT touch the status color variables, `@layer base` block styles, warm-50/warm-100 colors, or any chart/destructive values.
  </action>
  <verify>
    <automated>grep -c "terracotta" src/app/globals.css | xargs test 0 -eq && echo "PASS: no terracotta in globals.css" || echo "FAIL: terracotta still present"</automated>
  </verify>
  <done>globals.css has sage palette in @theme inline, shadcn overrides use sage-based colors, zero terracotta references remain</done>
</task>

<task type="auto">
  <name>Task 2: Replace terracotta class names with sage in all components</name>
  <files>src/app/(app)/dashboard/MilestoneCard.tsx, src/app/(app)/dashboard/MilestoneGrid.tsx, src/app/(app)/decisions/[id]/OptionCard.tsx</files>
  <action>
Perform exact string replacements across all files in `src/app/` and `src/components/` per the COLOR_MIGRATION.md spec:

| Find | Replace |
|------|---------|
| `bg-terracotta-500` | `bg-sage-600` |
| `bg-terracotta-600` | `bg-sage-700` |
| `bg-terracotta-50` | `bg-sage-50` |
| `bg-terracotta-100` | `bg-sage-100` |
| `text-terracotta-700` | `text-sage-700` |
| `text-terracotta-500` | `text-sage-600` |
| `border-terracotta-500` | `border-sage-600` |
| `border-terracotta-200` | `border-sage-200` |
| `hover:bg-terracotta-600` | `hover:bg-sage-700` |
| `hover:text-terracotta-700` | `hover:text-sage-700` |
| `ring-terracotta-500` | `ring-sage-600` |
| `focus:ring-terracotta-500` | `focus:ring-sage-600` |

Known files with terracotta classes:
- `src/app/(app)/dashboard/MilestoneCard.tsx` — status badge colors (lines 17-18)
- `src/app/(app)/dashboard/MilestoneGrid.tsx` — button class (line 114)
- `src/app/(app)/decisions/[id]/OptionCard.tsx` — progress bar, text, vote button (lines 29, 33, 92)

After replacements, run a final grep for any remaining `terracotta` in src/ to catch edge cases. If any found, replace them following the same sage mapping pattern.

Do NOT modify any `bg-green-100`, `text-green-700`, `bg-amber-100`, `text-amber-700` classes — these are status badge colors.
  </action>
  <verify>
    <automated>grep -r "terracotta" src/app/ src/components/ 2>/dev/null | grep -v node_modules && echo "FAIL: terracotta references remain" || echo "PASS: no terracotta in source"</automated>
  </verify>
  <done>All terracotta class references replaced with sage equivalents. Zero terracotta references in src/app/ and src/components/. Status badge colors (green/amber) unchanged.</done>
</task>

<task type="auto">
  <name>Task 3: Verify build and type-check</name>
  <files></files>
  <action>
Run the build and type-check to confirm nothing broke:
1. `npx tsc --noEmit` — type-check passes
2. `npm run build` — production build succeeds

If either fails, diagnose and fix. Common issues:
- Typo in class name (won't cause build failure but check for consistency)
- Missing CSS variable reference (would cause build warning)
  </action>
  <verify>
    <automated>cd /Users/aaronwoo/claude/twogether && npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>TypeScript type-check and Next.js production build both pass with zero errors</done>
</task>

</tasks>

<verification>
- `grep -r "terracotta" src/` returns zero matches
- `npm run build` succeeds
- globals.css contains `--color-sage-` variables
- MilestoneCard.tsx, MilestoneGrid.tsx, OptionCard.tsx all reference `sage-` classes
</verification>

<success_criteria>
- Complete removal of all terracotta references from source code
- Sage green palette defined in globals.css @theme inline block
- shadcn CSS variable overrides updated to sage-based colors
- All component class names migrated from terracotta-* to sage-*
- Build and type-check pass
- Status badge colors (green/amber) untouched
</success_criteria>

<output>
After completion, create `.planning/quick/260406-qvk-implement-color-migration-from-terracott/260406-qvk-SUMMARY.md`
</output>

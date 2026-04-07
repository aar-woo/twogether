---
phase: quick
plan: 260406-qvk
subsystem: ui/theme
tags: [color-migration, sage, tailwind, css-variables, rebrand]
dependency_graph:
  requires: []
  provides: [sage-green-palette, terracotta-removed]
  affects: [dashboard, decisions, globals]
tech_stack:
  added: []
  patterns: [tailwind-v4-css-theme, hex-color-variables]
key_files:
  created: []
  modified:
    - src/app/globals.css
    - src/app/(app)/dashboard/MilestoneCard.tsx
    - src/app/(app)/dashboard/MilestoneGrid.tsx
    - src/app/(app)/decisions/[id]/OptionCard.tsx
decisions:
  - "Sage palette defined with hex values (not oklch) per spec — consistency with hex-based COLOR_MIGRATION.md reference"
  - "bg-terracotta-500 mapped to bg-sage-600 (not sage-500) per migration table — sage-600 is the equivalent visual weight"
  - "shadcn CSS variable overrides updated with hex values; neutral/background values left as oklch warm tones"
metrics:
  duration: 10min
  completed: "2026-04-05"
  tasks: 3
  files: 4
requirements: [COLOR-MIGRATION]
---

# Quick Task 260406-qvk: Color Migration Terracotta to Sage Green Summary

**One-liner:** Complete visual rebrand replacing terracotta palette with sage green across globals.css CSS variables and all component class names.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace terracotta palette with sage in globals.css | 13d9e5a5 | src/app/globals.css |
| 2 | Replace terracotta class names in all components | da73f39d | MilestoneCard.tsx, MilestoneGrid.tsx, OptionCard.tsx |
| 3 | Verify build and type-check | (no commit — verification only) | — |

## What Was Done

### Task 1 — globals.css palette migration

In the `@theme inline` block:
- Replaced `--color-terracotta-50` through `--color-terracotta-700` with `--color-sage-50` through `--color-sage-700` using hex values from the COLOR_MIGRATION.md spec.

In the `:root` block (shadcn variable overrides):
- `--primary`: `oklch(60% 0.14 35)` → `#4A8059` (sage-500)
- `--primary-foreground`: → `#EAF4EC` (sage-50)
- `--foreground`: → `#1E3325` (sage-800)
- `--card-foreground`, `--popover-foreground`: → `#1E3325`
- `--secondary`: → `#C8E3CC` (sage-100)
- `--secondary-foreground`: → `#1E3325`
- `--muted-foreground`: → `#3D6B4A` (sage-600)
- `--accent`: → `#C8E3CC` (sage-100)
- `--accent-foreground`: → `#1E3325`
- `--ring`: → `#4A8059`
- `--sidebar-primary`, `--sidebar-ring`: → `#4A8059`
- `--sidebar-primary-foreground`: → `#EAF4EC`
- `--sidebar-accent`: → `#C8E3CC`
- `--sidebar-accent-foreground`: → `#1E3325`

Neutral/background/border/input values left as warm oklch tones (unchanged).

### Task 2 — Component class migrations

| File | Change |
|------|--------|
| MilestoneCard.tsx | `complete` badge: `bg-terracotta-500` → `bg-sage-600`; `in_progress` badge: `bg-terracotta-100 text-terracotta-700` → `bg-sage-100 text-sage-700` |
| MilestoneGrid.tsx | Save button: `bg-terracotta-500` → `bg-sage-600` |
| OptionCard.tsx | Compatibility bar fill: `bg-terracotta-500` → `bg-sage-600`; score text: `text-terracotta-700` → `text-sage-700`; vote buttons: `bg-terracotta-500 hover:bg-terracotta-600 border-terracotta-500` → `bg-sage-600 hover:bg-sage-700 border-sage-600` |

### Task 3 — Build verification

- `npx tsc --noEmit` — passed (no errors)
- `npm run build` — compiled successfully, all 9 pages generated

## Verification

- `grep -r "terracotta" src/app/ src/components/` — zero matches
- Status badge classes (`bg-green-100`, `text-green-700`, `bg-amber-100`, `text-amber-700`) confirmed unchanged
- `globals.css` contains `--color-sage-` variables
- MilestoneCard.tsx, MilestoneGrid.tsx, OptionCard.tsx all reference `sage-` classes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- src/app/globals.css — exists, contains `--color-sage-50`
- src/app/(app)/dashboard/MilestoneCard.tsx — exists, contains `bg-sage-600`
- src/app/(app)/dashboard/MilestoneGrid.tsx — exists, contains `bg-sage-600`
- src/app/(app)/decisions/[id]/OptionCard.tsx — exists, contains `bg-sage-600`
- Commit 13d9e5a5 — verified (globals.css palette)
- Commit da73f39d — verified (component classes)
- Zero terracotta references in src/ — confirmed

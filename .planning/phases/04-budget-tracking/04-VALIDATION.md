---
phase: 4
slug: budget-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via `npm run test`) |
| **Config file** | `vitest.config.ts` or `package.json` scripts |
| **Quick run command** | `npm run lint && npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | BUDG-01 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | BUDG-02 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | BUDG-03 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | BUDG-04 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | BUDG-05 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 3 | BUDG-06 | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no new test framework needed. TypeScript strict mode and ESLint provide continuous feedback during execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overspend warning appears when allocated sum exceeds total budget | BUDG-02 | UI state logic, no unit test framework | Create categories summing > wedding total; verify inline warning renders |
| Paid vs pending expenses are visually distinct | BUDG-05 | Visual distinction requires browser | Add paid and pending expenses; verify color/badge difference in list |
| Dashboard budget cards match budget page totals | BUDG-06 | Cross-page data consistency | Check dashboard totals after adding expenses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

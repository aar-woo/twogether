---
phase: 5
slug: guest-list
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no test config files found in project |
| **Config file** | none |
| **Quick run command** | `npm run build && npm run lint` |
| **Full suite command** | `npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run lint`
- **After every plan wave:** Run `npx tsc --noEmit && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green + all 4 success criteria verified manually
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | GUES-01 | build+lint | `npm run build && npm run lint` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | GUES-02 | build+lint | `npm run build && npm run lint` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | GUES-03 | build+lint | `npm run build && npm run lint` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npx shadcn@latest add select` — install Select component before any GuestClient code

*Existing build infrastructure covers type-check and lint verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Add guest with name/side/relationship/invited | GUES-01 | No test framework | Add a guest, verify it appears in table with correct values |
| Edit and delete guest | GUES-02 | No test framework | Edit a guest's side/relationship, verify counts update; delete, verify removed |
| Summary counts by side and relationship | GUES-03 | No test framework | Add 5 guests with varied values, verify all counts match |
| Invited toggle updates summary immediately | GUES-01 | No test framework | Toggle invited on a guest, verify total invited count updates without refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

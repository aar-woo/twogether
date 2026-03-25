---
phase: 3
slug: decision-queue-voting
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project uses Playwright MCP + Supabase MCP for verification |
| **Config file** | none — no automated test framework installed |
| **Quick run command** | `npx tsc --noEmit && npm run lint` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit` — zero TypeScript errors
- **After every plan wave:** `npm run build` — full production build passes
- **Before `/gsd:verify-work`:** Full build green + Playwright MCP walkthrough of decision flow
- **Max feedback latency:** ~30 seconds (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DECI-01–08 | automated | `npx tsc --noEmit` | ✅ migration | ⬜ pending |
| 03-02-01 | 02 | 2 | DECI-01, DECI-08 | automated | `npm run build` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | DECI-01, DECI-02 | manual (Playwright) | — | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | DECI-03, DECI-04, DECI-05, DECI-06 | automated | `npm run build` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | DECI-03–06 | manual (Playwright) | — | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | DECI-07 | automated | `npm run build` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 4 | DECI-07, DECI-08 | manual (Playwright) | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework installation needed. Project verification uses:
- `npx tsc --noEmit` — TypeScript strict check after each task
- `npm run build` — production build after each wave
- Playwright MCP — interactive flow verification at phase gate
- Supabase MCP — RLS policy verification via SQL

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Partner rating hidden until both vote | DECI-04 | Requires two user sessions / RLS state | Log in as user A, rate option. Log in as user B — confirm A's rating not visible. User B rates — confirm both ratings now visible. |
| Compatibility score shown after both vote | DECI-05 | Requires two votes present | After both partners vote an option, confirm score bar + % appears |
| Only own rating shown when partner pending | DECI-06 | Requires one-sided vote state | Vote as user A, confirm "Waiting for partner" shown, not user B's rating |
| Queue order persists via up/down | DECI-08 | Requires DB persistence check | Move a decision up, hard refresh, confirm new order persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

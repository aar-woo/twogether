---
phase: 2
slug: dashboard-progress-map
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — Wave 0 decision: rely on Playwright MCP + Supabase MCP (no unit test framework required for this phase) |
| **Config file** | none — Playwright MCP used for smoke/e2e |
| **Quick run command** | `npm run build && npm run lint` |
| **Full suite command** | Playwright MCP: login → dashboard → milestone toggle → add custom → budget cards |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run lint`
- **After every plan wave:** Run Playwright MCP full dashboard flow
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-xx-01 | 01 | 1 | DASH-01 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 2-xx-02 | 01 | 1 | MILE-01 | integration | Supabase MCP SQL verify | N/A | ⬜ pending |
| 2-xx-03 | 02 | 1 | MILE-02 | smoke | Playwright MCP toggle | N/A | ⬜ pending |
| 2-xx-04 | 02 | 1 | MILE-03 | smoke | Playwright MCP add custom | N/A | ⬜ pending |
| 2-xx-05 | 02 | 1 | MILE-04 | smoke | Playwright MCP badge classes | N/A | ⬜ pending |
| 2-xx-06 | 03 | 2 | DASH-02 | smoke | Manual `npm run dev` + visual | N/A | ⬜ pending |
| 2-xx-07 | 03 | 2 | DASH-03 | smoke | Playwright MCP milestone grid | N/A | ⬜ pending |
| 2-xx-08 | 03 | 2 | DASH-04 | e2e | Playwright MCP auth redirect | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per research recommendation, this phase uses Playwright MCP + Supabase MCP for all verification. No unit test framework installation required.

- [ ] Playwright MCP available in session (browser_navigate, browser_snapshot, browser_click)
- [ ] Supabase MCP available in session (for SQL verification of milestone seeding)
- [ ] Local dev server running (`npm run dev`) for Playwright smoke tests

*No new test files needed — all verifications use MCP tools.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Budget cards show $0 when no data | DASH-01 | Server Component, no unit test framework | Navigate to /dashboard, confirm budget cards render $0 values |
| `revalidatePath` called after mutations | DASH-02 | Implementation detail | Toggle milestone, refresh page, verify state persists |
| Custom milestone persists on refresh | MILE-03 | State + DB check | Add custom milestone, hard refresh, verify it appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

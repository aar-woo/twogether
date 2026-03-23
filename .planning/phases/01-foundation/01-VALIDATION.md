---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project is pre-scaffold (Wave 0 gap) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build && npx tsc --noEmit` |
| **Full suite command** | `npm run build && npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npx tsc --noEmit`
- **After every plan wave:** Run `npm run build && npx tsc --noEmit && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green + all 10 DB tables verified via Supabase MCP
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | AUTH-01 | build | `npm run build && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | AUTH-03 | build | `npm run build && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-01 | smoke | Playwright MCP — navigate to /login | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-02 | smoke | Playwright MCP — refresh browser after login | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | AUTH-03 | smoke | Playwright MCP — navigate to /dashboard unauthenticated | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 2 | COUP-03 | db | SQL via Supabase MCP — insert 3 members, assert exception | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Playwright MCP setup confirmed — covers AUTH-01, AUTH-02, AUTH-03 smoke tests
- [ ] DB trigger test SQL ready — `INSERT INTO wedding_members` three times, verify exception on third (COUP-03)
- [ ] `npm run dev` verified to start without errors after scaffold

*All Wave 0 items are verification-setup tasks, not test file authoring — Playwright MCP and Supabase MCP replace a traditional test framework for this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User signs up and lands on dashboard | AUTH-01 | UI interaction + auth flow | Open browser, navigate to /signup, complete form, verify redirect to /dashboard |
| Session persists across refresh | AUTH-02 | Browser state | Log in, press F5, confirm still authenticated |
| Redirect to /login for protected routes | AUTH-03 | Middleware routing | Log out, navigate directly to /dashboard, verify redirect |
| 10 tables exist with RLS enabled | (schema) | Requires running DB | Run Supabase MCP `list_tables` after migration |
| `get_my_wedding_id()` helper deployed | (schema) | Requires running DB | Run SQL: `SELECT get_my_wedding_id()` via Supabase MCP |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

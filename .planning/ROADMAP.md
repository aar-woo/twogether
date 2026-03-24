# Roadmap: Twogether

**Milestone:** v1 — Full wedding planning collaboration app
**Phases:** 7
**Requirements:** 34 mapped, 0 unmapped

---

## Phase 1: Foundation

**Goal:** Establish the full DB schema with RLS, project scaffold, auth flows, and layout shell — everything required before any feature can be built.

**Requirements:** AUTH-01, AUTH-02, AUTH-03, COUP-03

**Plans:** 2/3 plans executed

Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js project and apply all DB migrations (schema, helper, indexes, RLS, trigger)
- [ ] 01-02-PLAN.md — Configure terracotta theme, Supabase clients, middleware, and route group layout shells
- [ ] 01-03-PLAN.md — Build login, signup, and onboarding pages with server actions

**Success Criteria:**
1. `npm run dev` starts without errors; `npm run build` passes with zero type errors
2. User can sign up, complete onboarding (create wedding), and land on an empty dashboard
3. Unauthenticated user is redirected to `/login` when accessing any protected route
4. Session persists across browser refresh (no re-login required)
5. DB schema applied: all 10 tables exist with RLS enabled and `get_my_wedding_id()` helper deployed

---

## Phase 2: Dashboard + Progress Map

**Goal:** Build the dashboard hub showing budget snapshot and milestone progress map, including the default milestone seeding and status toggles.

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, MILE-01, MILE-02, MILE-03, MILE-04

**Plans:** 3 plans

Plans:
- [ ] 02-01-PLAN.md — Apply Phase 2 schema migration (notes column, dismissed_welcome, seed trigger, backfill)
- [ ] 02-02-PLAN.md — Dashboard server page, budget stat cards, WelcomeBanner
- [ ] 02-03-PLAN.md — MilestoneGrid + MilestoneCard client components with optimistic toggle, notes, add

**Success Criteria:**
1. After onboarding, 9 default milestones appear on the dashboard map
2. Toggling a milestone status (not_started → in_progress → complete) updates the map immediately and persists on refresh
3. Adding a custom milestone appends it to the list and persists on refresh
4. Budget cards show $0 values correctly when no budget data exists
5. Dashboard is inaccessible to unauthenticated users (redirected to login)

---

## Phase 3: Decision Queue + Voting

**Goal:** Build the decision queue with option management, per-partner voting with hidden ratings, compatibility scoring, and resolve flow.

**Requirements:** DECI-01, DECI-02, DECI-03, DECI-04, DECI-05, DECI-06, DECI-07, DECI-08

**Success Criteria:**
1. Partner A creates a decision with 2 options; both appear in the queue
2. Partner A rates option 1 (rating: 8); Partner B has not voted — no score shown, Partner B's rating not visible
3. Partner B rates option 1 (rating: 6) — compatibility score appears: ~54.4 (avg=7, diff=2)
4. Resolving a decision with a selected winner updates the status badge and displays winner
5. Reordering via up/down buttons persists on refresh

---

## Phase 4: Budget Tracking

**Goal:** Build budget categories, expense logging, and connect aggregates to the dashboard budget snapshot.

**Requirements:** BUDG-01, BUDG-02, BUDG-03, BUDG-04, BUDG-05, BUDG-06

**Success Criteria:**
1. Create 2 categories; when allocated sum exceeds total budget, inline warning appears
2. Add paid and pending expenses; spent total equals sum of paid expenses only
3. Dashboard budget cards match the budget page totals
4. Editing and deleting an expense updates all affected totals immediately
5. Paid vs pending expenses are visually distinct in the expense list

---

## Phase 5: Guest List

**Goal:** Build the guest list with add/edit/delete and a summary section showing counts by side and relationship.

**Requirements:** GUES-01, GUES-02, GUES-03

**Success Criteria:**
1. Add 5 guests with varied side/relationship values; all summary counts are correct
2. Toggle `invited` on a guest; total invited count updates immediately
3. Delete a guest; all summary counts update correctly
4. Edit a guest's side/relationship; breakdown counts update

---

## Phase 6: Settings + Partner Invite

**Goal:** Build the settings page (wedding name/date/budget) and the full invite flow — send link, claim token, join wedding.

**Requirements:** COUP-01, COUP-02, COUP-04, SETT-01, SETT-02, SETT-03, SETT-04

**Success Criteria:**
1. Partner A creates invite in Settings; claim link is displayed in the UI
2. Partner B opens the link, signs up, claims the invite, and is redirected to the dashboard
3. Both partners now see the same dashboard data
4. InviteForm is hidden after partner has joined
5. Editing total budget in Settings updates the dashboard budget card immediately

---

## Phase 7: Polish + Final Verification

**Goal:** Add loading states, error handling, empty states, and responsive layout across all pages. Verify the full end-to-end flow and RLS isolation.

**Requirements:** (cross-cutting — verifies all 34 v1 requirements)

**Success Criteria:**
1. `npm run build` passes with zero type errors
2. Full flow works end-to-end: signup → onboarding → invite partner → decisions + voting → budget → guests → settings
3. Compatibility score verified against formula in at least 3 test cases
4. RLS verified: User A cannot read User B's wedding data via direct API calls
5. All list pages show appropriate empty states; all async operations show loading feedback

---

## Requirement Coverage

| Phase | Requirements |
|-------|-------------|
| Phase 1 | AUTH-01, AUTH-02, AUTH-03, COUP-03 |
| Phase 2 | DASH-01, DASH-02, DASH-03, DASH-04, MILE-01, MILE-02, MILE-03, MILE-04 |
| Phase 3 | DECI-01, DECI-02, DECI-03, DECI-04, DECI-05, DECI-06, DECI-07, DECI-08 |
| Phase 4 | BUDG-01, BUDG-02, BUDG-03, BUDG-04, BUDG-05, BUDG-06 |
| Phase 5 | GUES-01, GUES-02, GUES-03 |
| Phase 6 | COUP-01, COUP-02, COUP-04, SETT-01, SETT-02, SETT-03, SETT-04 |
| Phase 7 | Cross-cutting (all 34 verified) |

---

*Roadmap created: 2026-03-07*
*Updated: 2026-03-07 — Phase 1 plans created (3 plans, 3 waves)*

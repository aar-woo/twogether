# Requirements: Twogether

**Defined:** 2026-03-07
**Core Value:** Both partners can vote on decisions independently, with compatibility scores revealing alignment — without seeing each other's ratings first.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password and create a wedding during onboarding
- [ ] **AUTH-02**: Authenticated user session persists across browser refresh
- [ ] **AUTH-03**: Unauthenticated users are redirected to login when accessing protected routes

### Couple Linking

- [ ] **COUP-01**: Wedding owner can generate an invite link for their partner
- [ ] **COUP-02**: Partner can open invite link, sign up or log in, and join the wedding
- [x] **COUP-03**: A wedding enforces a maximum of 2 members; no third member can join
- [ ] **COUP-04**: After claiming invite, both partners see the same shared dashboard

### Dashboard

- [ ] **DASH-01**: Dashboard shows budget snapshot: total budget, total allocated, total spent, remaining
- [ ] **DASH-02**: Dashboard budget totals update when expenses or budget settings change
- [ ] **DASH-03**: Dashboard shows milestone progress map with status-based visual indicators
- [ ] **DASH-04**: Dashboard is accessible only to authenticated members of that wedding

### Milestones

- [ ] **MILE-01**: 9 default milestones are seeded automatically on wedding creation
- [ ] **MILE-02**: Either partner can toggle a milestone's status (not_started / in_progress / complete)
- [ ] **MILE-03**: Either partner can add a custom milestone appended to the list
- [ ] **MILE-04**: Progress map visually distinguishes all three milestone statuses

### Decisions

- [ ] **DECI-01**: Either partner can create a decision with a title and category
- [ ] **DECI-02**: Either partner can add options to any decision at any time
- [ ] **DECI-03**: Each partner can rate an option 1–10 with an optional comment
- [ ] **DECI-04**: A partner's rating is hidden from the other until both have voted on that option
- [ ] **DECI-05**: Once both partners have voted, the compatibility score is displayed
- [ ] **DECI-06**: If only one partner has voted, only their rating is shown (no score)
- [ ] **DECI-07**: Either partner can resolve a decision by selecting a winning option
- [ ] **DECI-08**: Decision queue order persists and can be adjusted via up/down buttons

### Budget

- [ ] **BUDG-01**: Couple can create budget categories with a name and allocated amount
- [ ] **BUDG-02**: Inline warning appears when sum of allocated amounts exceeds total budget
- [ ] **BUDG-03**: Expenses can be added within a category (vendor name, amount, date, status, note)
- [ ] **BUDG-04**: Expenses can be edited and deleted
- [ ] **BUDG-05**: Paid vs pending expenses are visually distinct
- [ ] **BUDG-06**: Dashboard budget totals reflect current category and expense data

### Guests

- [ ] **GUES-01**: Either partner can add a guest with name, relationship, side, and invited status
- [ ] **GUES-02**: Guests can be edited and deleted
- [ ] **GUES-03**: Summary section shows total invited count plus breakdowns by side and relationship

### Settings

- [ ] **SETT-01**: Wedding owner can update the wedding name, date, and total budget
- [ ] **SETT-02**: Changes to total budget reflect immediately on the dashboard
- [ ] **SETT-03**: Partner invite link is only available to send if the wedding has no second member
- [ ] **SETT-04**: Invite link is displayed in the UI for the owner to copy (no email delivery in v1)

## v2 Requirements

### Realtime

- **RT-01**: Vote changes sync live without page refresh when both partners are online

### Guests

- **GUES-V2-01**: Guest RSVP tracking (pending/yes/no/maybe) with email invite links

### AI

- **AI-01**: Decision summary cards with disagreement highlights
- **AI-02**: Queue prioritization suggestions based on wedding date

### UX

- **UX-01**: Drag-to-reorder decision queue
- **UX-02**: Export/print budget and guest list

### Scale

- **SCALE-01**: Multi-wedding support per user
- **SCALE-02**: Wedding planner role managing multiple couples

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email delivery for partner invites | Avoids email provider setup; link-in-UI sufficient for v1 |
| Vendor contact management beyond name | Scope creep; name on expense is sufficient |
| Mobile-native app | Web-first; responsive layout acceptable for v1 |
| Real-time updates (Supabase Realtime) | Complexity not justified for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| COUP-01 | Phase 6 | Pending |
| COUP-02 | Phase 6 | Pending |
| COUP-03 | Phase 1 | Complete |
| COUP-04 | Phase 6 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| MILE-01 | Phase 2 | Pending |
| MILE-02 | Phase 2 | Pending |
| MILE-03 | Phase 2 | Pending |
| MILE-04 | Phase 2 | Pending |
| DECI-01 | Phase 3 | Pending |
| DECI-02 | Phase 3 | Pending |
| DECI-03 | Phase 3 | Pending |
| DECI-04 | Phase 3 | Pending |
| DECI-05 | Phase 3 | Pending |
| DECI-06 | Phase 3 | Pending |
| DECI-07 | Phase 3 | Pending |
| DECI-08 | Phase 3 | Pending |
| BUDG-01 | Phase 4 | Pending |
| BUDG-02 | Phase 4 | Pending |
| BUDG-03 | Phase 4 | Pending |
| BUDG-04 | Phase 4 | Pending |
| BUDG-05 | Phase 4 | Pending |
| BUDG-06 | Phase 4 | Pending |
| GUES-01 | Phase 5 | Pending |
| GUES-02 | Phase 5 | Pending |
| GUES-03 | Phase 5 | Pending |
| SETT-01 | Phase 6 | Pending |
| SETT-02 | Phase 6 | Pending |
| SETT-03 | Phase 6 | Pending |
| SETT-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after initialization*

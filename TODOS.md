# Twogether — Implementation Todos

## Milestone 1: Foundation (auth + DB schema + skeleton UI)

### Supabase + Environment

- [ ] Create Supabase project; collect `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `.env.local` with Supabase credentials (gitignored)

### Database Migrations

- [ ] `001_schema.sql` — weddings, wedding_members, invites
- [ ] `002_rls_helpers.sql` — `get_my_wedding_id()` security definer function + RLS indexes
- [ ] `003_rls_core.sql` — RLS policies for weddings, wedding_members, invites
- [ ] `004_milestones.sql` — milestones table + RLS
- [ ] `005_decisions.sql` — decisions, decision_options, votes + RLS
- [ ] `006_budget.sql` — budget_categories, expenses + RLS
- [ ] `007_guests.sql` — guests table + RLS

### RLS Policies

- [ ] weddings: members can read/write their own wedding (via `get_my_wedding_id()`)
- [ ] wedding_members: self-join pattern to avoid recursion; BEFORE INSERT trigger enforces max 2 members
- [ ] milestones, decisions, budget_categories, guests: wedding-scoped via `(SELECT get_my_wedding_id())`
- [ ] decision_options, expenses: two-hop via parent table join + `get_my_wedding_id()`
- [ ] votes: write = user-scoped; read = own votes always + partner's votes only after both have voted (EXISTS pattern)
- [ ] invites: owner can insert; token lookup uses service role key at API layer, not RLS

### Project Scaffold

- [ ] `package.json` with Next.js 14, Supabase JS, shadcn/ui, Tailwind, TypeScript
- [ ] `next.config.ts`, `tsconfig.json` (strict), `tailwind.config.ts`, `postcss.config.mjs`
- [ ] `app/globals.css` + base Tailwind directives
- [ ] `lib/supabase/client.ts` — browser client
- [ ] `lib/supabase/server.ts` — server client (cookie-based)
- [ ] `types/index.ts` — TypeScript types for all DB entities

### Auth Flow

- [ ] `app/(auth)/login/page.tsx` — email/password login form
- [ ] `app/(auth)/login/actions.ts` — Supabase `signInWithPassword`
- [ ] `app/(auth)/signup/page.tsx` — signup form
- [ ] `app/(auth)/signup/actions.ts` — Supabase `signUp` + redirect to onboarding
- [ ] `app/(app)/onboarding/page.tsx` — create wedding form (name, date, total budget)
- [ ] `app/(app)/onboarding/actions.ts` — insert wedding + wedding_members (owner) + seed milestones

### Layout Shell

- [ ] `app/(app)/layout.tsx` — auth guard (redirect to login if no session) + sidebar nav
- [ ] Sidebar links: Dashboard, Decisions, Budget, Guests, Settings
- [ ] `app/(auth)/layout.tsx` — minimal unauthenticated layout

### Verification

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes with no type errors
- [ ] User can sign up, complete onboarding, and see an empty dashboard
- [ ] User is redirected to login if unauthenticated

---

## Milestone 2: Dashboard + Progress Map

### Dashboard Page

- [ ] `app/(app)/dashboard/page.tsx` — fetch budget snapshot + milestones
- [ ] Budget summary cards: total budget / allocated / spent / remaining
- [ ] Milestone progress map rendered inline or via `components/ProgressMap.tsx`

### Progress Map Component

- [ ] `components/ProgressMap.tsx` — node graph with status-based color coding
  - not_started: gray, in_progress: amber, complete: green
- [ ] Clicking a node opens inline status toggle (not_started → in_progress → complete)
- [ ] "Add custom milestone" button appends to list

### Verification

- [ ] Default 9 milestones appear after onboarding
- [ ] Toggling milestone status updates the map immediately
- [ ] Adding a custom milestone appends it and persists on refresh
- [ ] Budget cards show $0 values correctly when no data exists

---

## Milestone 3: Decision Queue + Voting

### Decision List

- [ ] `app/(app)/decisions/page.tsx` — list open decisions with order, category, status
- [ ] Create decision form (title + category dropdown)
- [ ] Up/down reorder buttons; persist `order` field on change
- [ ] Filter or separate section for resolved decisions

### Decision Detail + Options

- [ ] `app/(app)/decisions/[id]/page.tsx` — decision detail with options list
- [ ] Add option form (label text field)
- [ ] `app/(app)/decisions/actions.ts` — server actions for create/update/delete

### Voting UI

- [ ] `components/VoteCard.tsx` — per-option card
  - Shows option label + "Add/Edit your rating" if current user hasn't voted
  - Rating input: 1–10 slider or number input + optional comment
  - If current user has voted but partner hasn't: show own rating, "Waiting for partner"
  - If both voted: show both ratings + compatibility score bar
- [ ] Compatibility score calculation:
  ```ts
  const avg = (ratingA + ratingB) / 2;
  const score = (avg / 10) * (1 - Math.abs(ratingA - ratingB) / 9) * 100;
  ```

### Resolve Decision

- [ ] "Mark Resolved" button on decision detail; select winning option from dropdown
- [ ] Resolved decisions show winner prominently; status badge changes

### Verification

- [ ] Partner A creates a decision and adds 2 options
- [ ] Partner A rates option 1 (rating: 8); partner B has not voted → no score shown
- [ ] Partner B rates option 1 (rating: 6) → compatibility score appears
  - avg=7, diff=2, score = (7/10) × (1 - 2/9) × 100 = 70 × 0.778 = ~54.4
- [ ] Decision resolved; winner displayed
- [ ] Queue reorder persists on refresh

---

## Milestone 4: Budget Tracking

### Budget Page

- [ ] `app/(app)/budget/page.tsx` — category list with allocated amounts + expense sub-lists
- [ ] Create category form (name + allocated_amount)
- [ ] Inline warning if sum of allocated > total_budget
- [ ] `app/(app)/budget/actions.ts` — server actions for categories and expenses

### Expense Logging

- [ ] Add expense form per category: vendor_name, amount, date, status (paid/pending), note
- [ ] Expense rows: inline edit + delete
- [ ] Category totals: allocated / spent (paid) / remaining per category

### Dashboard Integration

- [ ] Dashboard budget cards pull from `budget_categories` + `expenses` aggregates
- [ ] Remaining = total_budget − sum(paid expenses)

### Verification

- [ ] Create 2 categories; allocated sum > total triggers warning
- [ ] Add paid and pending expenses; verify spent = sum of paid only
- [ ] Dashboard totals match budget page totals
- [ ] Edit and delete expense; totals update

---

## Milestone 5: Guest List

### Guest Page

- [ ] `app/(app)/guests/page.tsx` — guest table with summary section at top
- [ ] Add guest form: name, relationship, side, invited toggle
- [ ] Inline edit + delete per guest
- [ ] `app/(app)/guests/actions.ts` — server actions

### Summary Section

- [ ] Total invited (where `invited = true`)
- [ ] Breakdown by side: partner_a / partner_b / both
- [ ] Breakdown by relationship: family / friend / work / other

### Verification

- [ ] Add 5 guests with varied side/relationship; verify all summary counts
- [ ] Toggle `invited` on a guest; total count updates
- [ ] Delete a guest; counts update

---

## Milestone 6: Settings + Partner Invite

### Settings Page

- [ ] `app/(app)/settings/page.tsx` — wedding name, date, total budget (edit in place)
- [ ] `app/(app)/settings/InviteForm.tsx` — invite partner by email
  - Only shown if wedding has no second member
  - On submit: insert into `invites` table; display shareable link (v1 — no email send)

### Invite Claim Flow

- [ ] `app/invite/[token]/page.tsx` — validate token, show wedding name
  - If unauthenticated: redirect to signup with `next=/invite/[token]`
  - If authenticated: show "Join [Wedding Name]" button
- [ ] `app/api/invite/claim/route.ts` — mark invite claimed, insert wedding_member as partner
- [ ] `app/api/invite/send/route.ts` — insert invite record, return claim URL

### Verification

- [ ] Partner A creates invite; link displayed in UI
- [ ] Partner B opens link, signs up, claims invite → redirected to dashboard
- [ ] Both partners now see the same dashboard data
- [ ] InviteForm hidden after partner has joined
- [ ] Editing total_budget in settings updates dashboard immediately

---

## Milestone 7: Polish + Final Verification

### Cross-cutting

- [ ] Loading states for all async operations (skeleton loaders or spinners)
- [ ] Error handling: form validation messages, server action error toasts
- [ ] Empty states for all list pages (decisions, budget, guests)
- [ ] Responsive layout check (tablet + mobile breakpoints)

### Final End-to-End

- [ ] `npm run build` passes with zero type errors
- [ ] Full flow: signup → onboarding → invite partner → decisions + voting → budget → guests → settings
- [ ] Compatibility score verified against formula in at least 3 test cases
- [ ] RLS verified: user A cannot read user B's wedding data via direct API calls

---

## v2 Backlog (do not build in v1)

- Supabase Realtime live vote sync
- Guest RSVP tracking (pending/yes/no/maybe) with email links
- AI insight cards (decision summaries, disagreement highlights)
- AI queue prioritization by wedding date
- Drag-to-reorder decision queue
- Vendor contact management
- Multi-wedding support
- Export / print budget + guest list


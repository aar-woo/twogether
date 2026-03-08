# Twogether — Wedding Planner Decision Hub

## Overview

Twogether is a collaborative wedding planning app where engaged couples make decisions together: each partner rates options independently, and a compatibility score reveals where they agree or diverge. Beyond decisions, the app tracks budget, guests, and planning progress through a visual milestone map.

**Target users:** Engaged couples planning a wedding. Secondary: wedding planners managing multiple couples (v2+).

---

## Core Features (v1)

### 1. Auth + Couple Linking

**Signup/Login**

- Email + password auth via Supabase Auth
- After signup, user is prompted to create a wedding or claim an invite

**Invite Partner**

- Partner A sends email invite from Settings
- Token stored in `invites` table; email sent with link to `/invite/[token]`
- Partner B opens link, signs up or logs in, then joins the wedding
- Both partners now see the same wedding data

**Acceptance criteria:**

- [ ] User can sign up, create a wedding, and land on dashboard
- [ ] User can invite a partner via email; partner can claim invite and join
- [ ] A wedding has exactly 2 members (owner + partner); no third member can join
- [ ] After claiming invite, both partners see the same dashboard

---

### 2. Dashboard

A single-screen hub showing:

- Budget snapshot: total budget / allocated / spent / remaining
- Milestone progress map (visual node graph)
- Quick links to Decisions, Budget, Guests

**Acceptance criteria:**

- [ ] Budget totals update in real time as expenses are added
- [ ] Milestone nodes update status when toggled
- [ ] Dashboard is accessible only to authenticated wedding members

---

### 3. Progress Map (Milestones)

Visual node graph showing planning stages with status indicators.

**Default milestones** (seeded on wedding creation, in order):
Venue, Catering, Photography, Music/Entertainment, Florals, Attire, Invitations, Honeymoon, Accommodations

**Milestone statuses:** `not_started` | `in_progress` | `complete`

**Acceptance criteria:**

- [ ] Default milestones appear on wedding creation
- [ ] Either partner can toggle a milestone's status
- [ ] Either partner can add a custom milestone (appended to the list)
- [ ] Progress map visually distinguishes not_started / in_progress / complete

---

### 4. Decision Queue + Voting

A queue of decisions the couple needs to make, with options rated by each partner independently.

**Creating decisions:**

- Either partner can create a decision (title + category)
- Either partner can add options to any decision at any time
- Queue order is manually set; reorder via up/down buttons (v1); drag-to-reorder is v2

**Voting:**

- Each partner rates each option 1–10 with an optional comment
- Partners cannot see each other's rating until both have voted on that option
- Once both have voted, compatibility score is displayed

**Compatibility score formula:**

```
score = (avg / 10) × (1 - |ratingA - ratingB| / 9) × 100
```

Where `avg = (ratingA + ratingB) / 2`. Result is 0–100.

**Resolving decisions:**

- Either partner can mark a decision `resolved` and select a winning option
- Resolved decisions move to the bottom of the queue (or a separate resolved view)

**Decision categories** (predefined, matching milestone names):
Venue, Catering, Photography, Music/Entertainment, Florals, Attire, Invitations, Honeymoon, Accommodations, Other

**Acceptance criteria:**

- [ ] Either partner can create a decision and add options
- [ ] Each partner can rate an option; ratings are hidden until both have voted
- [ ] Compatibility score renders correctly for both-voted options
- [ ] Single-voted options show only that partner's rating, no score
- [ ] Decision can be resolved with a selected winning option
- [ ] Queue order persists and can be manually changed

---

### 5. Budget Tracking

Hierarchical budget: total → categories → line-item expenses.

**Structure:**

- Wedding has one `total_budget` (set at onboarding, editable in Settings)
- Couples create `budget_categories` with an `allocated_amount`
- App warns (inline) if sum of allocated amounts exceeds total budget
- Within each category: log expenses with `vendor_name`, `amount`, `date`, `status` (paid/pending), optional `note`
- Expenses are editable and deletable

**Dashboard totals:**

- Total budget (from wedding)
- Total allocated (sum of category `allocated_amount`)
- Total spent (sum of `paid` expenses)
- Remaining (total budget − total spent)

**Acceptance criteria:**

- [ ] Couple can create categories with allocated amounts
- [ ] Warning appears when allocated > total budget
- [ ] Expenses can be added, edited, and deleted within a category
- [ ] Dashboard totals update correctly
- [ ] Paid vs pending expenses are visually distinct

---

### 6. Guest List

Track invited guests with relationship and side attribution.

**Per-guest fields:**

- `name` (required)
- `relationship`: family | friend | work | other
- `side`: partner_a | partner_b | both
- `invited`: boolean (default true)

**Summary view:**

- Total invited count
- Breakdown by side (partner_a / partner_b / both)
- Breakdown by relationship type

**Acceptance criteria:**

- [ ] Either partner can add, edit, and delete guests
- [ ] Summary counts update immediately on changes
- [ ] Guests can be filtered or sorted by side/relationship (nice-to-have; list is acceptable for v1)

---

### 7. Settings

- Edit wedding name and date
- Edit total budget
- Send partner invite (if no partner has joined yet)
- View wedding members

**Acceptance criteria:**

- [ ] Wedding owner can update name, date, and total budget
- [ ] Partner invite can only be sent if the wedding has no second member
- [ ] Changes to total budget reflect immediately on dashboard

---

## Data Model

### Entity Relationships

```
User (Supabase Auth)
  └── wedding_members (role: owner | partner)
        └── Wedding
              ├── milestones
              ├── decisions
              │     └── decision_options
              │           └── votes (per user)
              ├── budget_categories
              │     └── expenses
              ├── guests
              └── invites
```

### Schema

```sql
-- weddings
id uuid PK
created_by uuid FK(auth.users)
name text NOT NULL
date date
total_budget numeric DEFAULT 0
created_at timestamptz DEFAULT now()

-- wedding_members
id uuid PK
wedding_id uuid FK(weddings)
user_id uuid FK(auth.users)
role text CHECK(role IN ('owner','partner'))
joined_at timestamptz DEFAULT now()
UNIQUE(wedding_id, user_id)

-- milestones
id uuid PK
wedding_id uuid FK(weddings)
name text NOT NULL
status text CHECK(status IN ('not_started','in_progress','complete')) DEFAULT 'not_started'
order int NOT NULL
is_custom bool DEFAULT false
created_at timestamptz DEFAULT now()

-- decisions
id uuid PK
wedding_id uuid FK(weddings)
title text NOT NULL
category text NOT NULL
status text CHECK(status IN ('open','resolved')) DEFAULT 'open'
resolved_option_id uuid nullable FK(decision_options)
order int NOT NULL
created_at timestamptz DEFAULT now()

-- decision_options
id uuid PK
decision_id uuid FK(decisions)
label text NOT NULL
created_by uuid FK(auth.users)
created_at timestamptz DEFAULT now()

-- votes
id uuid PK
option_id uuid FK(decision_options)
user_id uuid FK(auth.users)
rating int CHECK(rating BETWEEN 1 AND 10)
comment text
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
UNIQUE(option_id, user_id)

-- budget_categories
id uuid PK
wedding_id uuid FK(weddings)
name text NOT NULL
allocated_amount numeric DEFAULT 0
created_at timestamptz DEFAULT now()

-- expenses
id uuid PK
budget_category_id uuid FK(budget_categories)
vendor_name text NOT NULL
amount numeric NOT NULL
date date
status text CHECK(status IN ('paid','pending')) DEFAULT 'pending'
note text
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()

-- guests
id uuid PK
wedding_id uuid FK(weddings)
name text NOT NULL
relationship text CHECK(relationship IN ('family','friend','work','other'))
side text CHECK(side IN ('partner_a','partner_b','both'))
invited bool DEFAULT true
created_at timestamptz DEFAULT now()

-- invites
id uuid PK
wedding_id uuid FK(weddings)
email text NOT NULL
token uuid UNIQUE DEFAULT gen_random_uuid()
claimed_by uuid nullable FK(auth.users)
claimed_at timestamptz nullable
created_at timestamptz DEFAULT now()
```

### Couple-scoped vs User-scoped

| Data                                                                                            | Scope                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| weddings, milestones, decisions, decision_options, budget_categories, expenses, guests, invites | Couple (wedding_id) — both partners can read and write                                                                |
| votes                                                                                           | User-scoped for writes (each user owns their own votes); reads restricted until both partners have voted on an option |
| wedding_members role                                                                            | User-scoped (read-only after set)                                                                                     |

---

## Auth Model

- Authentication: Supabase Auth (email + password)
- A `User` maps to `auth.users.id`
- After signup, user creates a wedding → becomes `owner` in `wedding_members`
- Owner sends email invite → token stored in `invites`
- Invited user claims token at `/invite/[token]` → inserted into `wedding_members` as `partner`
- Both partners share all wedding-scoped data
- Max 2 members per wedding enforced in RLS and application logic
- JWT from Supabase Auth is used for all API calls; RLS enforces data isolation

---

## Tech Stack

| Layer           | Technology                       |
| --------------- | -------------------------------- |
| Framework       | Next.js 14+ (App Router)         |
| UI components   | shadcn/ui                        |
| Styling         | Tailwind CSS                     |
| Database + Auth | Supabase (Postgres + Auth + RLS) |
| ORM / query     | Supabase JS client (typed)       |
| TypeScript      | Strict mode                      |
| Hosting         | Vercel (assumed)                 |

---

## Out of Scope (v1)

- Supabase Realtime — live vote sync when both partners are online
- RSVP tracking — guest response status, email invite links to guests
- AI assistance — decision summaries, disagreement insights, "Ask AI" prompt
- AI queue prioritization — suggesting next decision based on wedding date
- Drag-to-reorder for decision queue (up/down buttons only)
- Mobile-optimized layout (desktop-first; responsive is acceptable)
- Multi-wedding support per user
- Wedding planner role managing multiple couples
- Export / print (guest list, budget)
- Vendor contact management beyond name field on expenses

---

## Open Questions

1. **Email delivery for invites** — Supabase doesn't send arbitrary emails out of the box. Will we use Supabase's built-in email (limited) or a third-party (Resend, SendGrid)? For v1 we can show the invite link in the UI for the owner to copy-paste.
2. **Ratings visibility** — The spec hides each partner's rating until both have voted. This requires a policy where `votes` rows are not readable by the other user until both exist. Is this the correct behavior, or is it acceptable to show ratings immediately?
3. **Wedding date required?** — Is `date` required at onboarding or can it be set later?
4. **Budget category names** — Are category names freeform, or should they be constrained to the milestone/decision category list?
5. **Guest count cap** — Any expected limit on guest list size?

Read the codebase at [path to GSD repo]. Analyze:

- Project structure and folder conventions
- How Supabase client is initialized (client vs server vs middleware)
- How auth sessions are handled
- How server actions and API routes are structured
- Data fetching patterns (server components vs client hooks)
- TypeScript conventions
- Testing setup and patterns
- Error handling approach

Then generate a CLAUDE.md for my NEW wedding planner project
that follows these same patterns. Include all commands,
conventions, and the Supabase rules I'll paste below.
Do NOT start coding.

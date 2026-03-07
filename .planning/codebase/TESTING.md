# Testing

**Analysis Date:** 2026-03-07

## Status

Pre-code scaffold. No test files or test framework configuration exists yet. This document captures the **testing intent** from `SPEC.md` and `TODOS.md` acceptance criteria, plus recommended patterns for this stack.

## Framework

No test framework configured. Recommended for this stack:

| Layer | Tool |
|-------|------|
| Unit / integration | Vitest |
| E2E | Playwright (MCP already available) |
| Component | React Testing Library + Vitest |

## Acceptance Criteria as Test Cases

Each milestone in `TODOS.md` has explicit verification criteria that map to tests:

### Auth + Couple Linking
- User can sign up, create a wedding, land on dashboard
- Partner invite flow: send invite → partner claims → both see same dashboard
- Max 2 members enforced — third member join attempt is rejected
- Unauthenticated access redirects to `/login`

### Dashboard
- Budget totals update when expenses change
- Milestone node status toggles persist
- Dashboard inaccessible without auth

### Decision Voting
- Both-voted options show compatibility score; single-voted options do not
- Compatibility score formula: `(avg/10) * (1 - |ratingA - ratingB| / 9) * 100`
- Test case from spec: ratingA=8, ratingB=6 → score ≈ 54.4
- Queue order persists on refresh
- Resolved decision shows winner prominently

### Budget
- Allocated sum > total_budget triggers inline warning
- Dashboard totals = budget page totals
- `spent` = sum of `paid` expenses only (not `pending`)

### RLS (Critical)
- User A cannot read User B's wedding data via direct API calls
- Vote rows not readable by partner until both have voted on that option
- Max 2 members trigger fires on third insert attempt

## Compatibility Score Unit Test

The formula is pure — test it in isolation:

```ts
function compatibilityScore(ratingA: number, ratingB: number): number {
  const avg = (ratingA + ratingB) / 2;
  return (avg / 10) * (1 - Math.abs(ratingA - ratingB) / 9) * 100;
}

// Test cases from spec:
// (8, 6) → avg=7, diff=2 → (7/10) * (1 - 2/9) * 100 ≈ 54.4
// (10, 10) → avg=10, diff=0 → (10/10) * (1 - 0/9) * 100 = 100
// (1, 10) → avg=5.5, diff=9 → (5.5/10) * (1 - 9/9) * 100 = 0
```

## Server Action Test Pattern

Server actions return `{ error?: string }` — never throw. Test both success and error paths:

```ts
// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  })),
}));

// Test error path
expect(await createDecision(invalidData)).toEqual({ error: expect.any(String) });

// Test success path
expect(await createDecision(validData)).not.toHaveProperty("error");
```

## RLS Test Pattern

Use Supabase SQL editor or `execute_sql` MCP for policy verification:

```sql
-- Simulate authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';

-- Verify user A cannot read user B's wedding
SELECT * FROM weddings WHERE id = 'user-b-wedding-id';
-- Expected: 0 rows
```

## E2E Test Approach (Playwright MCP)

The Playwright MCP is available for UI verification. Key flows to test:

1. **Full auth flow:** signup → onboarding → dashboard
2. **Invite flow:** send invite → partner B opens link → claims → both on dashboard
3. **Vote hidden:** partner A rates option, partner B has not voted → no score shown
4. **Vote revealed:** partner B rates same option → compatibility score appears
5. **Budget warning:** allocated sum > total_budget → inline warning appears

## Coverage Priorities

1. Compatibility score calculation (pure function — easy, high value)
2. Server action error handling (return shape contract)
3. RLS policies (security-critical, verify via SQL)
4. Invite claim flow (stateful, multi-user — highest complexity)
5. Vote visibility rule (security + UX correctness)

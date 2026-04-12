// Domain types — handwritten, not generated.
// Generated DB types live in types/supabase.ts (DO NOT EDIT).

export interface Wedding {
  id: string;
  created_by: string;
  name: string;
  date: string | null;
  total_budget: number;
  dismissed_welcome: boolean;
  created_at: string;
}

export interface Milestone {
  id: string;
  wedding_id: string;
  title: string;
  status: "not_started" | "in_progress" | "complete";
  is_default: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: "owner" | "partner";
  joined_at: string;
}

export interface Decision {
  id: string;
  wedding_id: string;
  title: string;
  category: string | null;
  status: "open" | "resolved";
  resolved_option_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DecisionOption {
  id: string;
  decision_id: string;
  label: string;
  created_at: string;
}

export interface Vote {
  id: string;
  option_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Enriched types used in page data fetches
export interface OptionWithVotes extends DecisionOption {
  votes: Vote[];
}

export interface DecisionWithOptions extends Decision {
  decision_options: OptionWithVotes[];
}

// Union type for deriving UI state from RLS-filtered vote rows
// The RLS policy only returns votes the current user can see:
// - 0 votes visible → unvoted (or partner not yet revealed)
// - 1 vote visible (own) → you_voted, waiting for partner
// - 2 votes visible → both_voted, reveal score
export type OptionVoteState =
  | { state: "unvoted" }
  | { state: "you_voted"; myVote: Vote }
  | { state: "both_voted"; myVote: Vote; partnerVote: Vote; score: number };

// Budget tracking types
export type ExpenseStatus = "paid" | "pending";

export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  allocated_amount: number;
  created_at: string | null;
}

export interface Expense {
  id: string;
  budget_category_id: string;
  vendor_name: string;
  amount: number;
  date: string | null;
  status: ExpenseStatus;
  note: string | null;
  created_at: string | null;
}

export interface CategoryWithExpenses extends BudgetCategory {
  expenses: Expense[];
}

// Guest list types
export type GuestSide = "Bride" | "Groom" | "Both";
export type GuestRelationship = "Family" | "Friend" | "Colleague" | "Plus One";

export const GUEST_SIDES: GuestSide[] = ["Bride", "Groom", "Both"];
export const GUEST_RELATIONSHIPS: GuestRelationship[] = [
  "Family",
  "Friend",
  "Colleague",
  "Plus One",
];

export const GUEST_SIDE_TO_DB: Record<GuestSide, string> = {
  Bride: "partner_a",
  Groom: "partner_b",
  Both: "shared",
};

export const GUEST_SIDE_FROM_DB: Record<string, GuestSide> = {
  partner_a: "Bride",
  partner_b: "Groom",
  shared: "Both",
};

export const GUEST_SIDE_ICON: Record<GuestSide, string> = {
  Bride: "👰",
  Groom: "🤵",
  Both: "👫",
};

export const GUEST_RELATIONSHIP_ICON: Record<GuestRelationship, string> = {
  Family: "🏠",
  Friend: "🤝",
  Colleague: "💼",
  "Plus One": "➕",
};

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  side: string | null;
  relationship: string | null;
  invited: boolean;
  created_at: string | null;
}

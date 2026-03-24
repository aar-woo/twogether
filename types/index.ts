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

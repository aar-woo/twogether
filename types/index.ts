// Domain types — handwritten, not generated.
// Generated DB types live in types/supabase.ts (DO NOT EDIT).

export interface Wedding {
  id: string;
  created_by: string;
  name: string;
  date: string | null;
  total_budget: number;
  created_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: "owner" | "partner";
  joined_at: string;
}

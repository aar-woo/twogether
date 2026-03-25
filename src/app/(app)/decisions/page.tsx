import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DecisionWithOptions } from "../../../../types/index";
import { DecisionQueue } from "./DecisionQueue";

export default async function DecisionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const { data: decisions } = await supabase
    .from("decisions")
    .select(`
      id, title, category, status, sort_order, resolved_option_id, wedding_id, created_at,
      decision_options (
        id, label, decision_id, created_at,
        votes ( id, user_id, rating, option_id, comment, created_at )
      )
    `)
    .order("status", { ascending: true })
    .order("sort_order", { ascending: true });

  return (
    <DecisionQueue
      decisions={(decisions ?? []) as unknown as DecisionWithOptions[]}
      currentUserId={user.id}
    />
  );
}

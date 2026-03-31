import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DecisionWithOptions } from "../../../../../types/index";
import { OptionList } from "./OptionList";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: decision } = await supabase
    .from("decisions")
    .select(
      `
      id, title, category, status, sort_order, resolved_option_id, created_at, wedding_id,
      decision_options (
        id, decision_id, label, created_at,
        votes ( id, option_id, user_id, rating, comment, created_at )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!decision) redirect("/decisions");

  return (
    <OptionList
      decision={decision as unknown as DecisionWithOptions}
      currentUserId={user.id}
    />
  );
}

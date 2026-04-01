import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OptionList } from "./OptionList";
import { getDecision } from "./actions";

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

  const { decision, error } = await getDecision(id, wedding.id);

  if (error || !decision) redirect("/decisions");

  return <OptionList decision={decision} currentUserId={user.id} />;
}

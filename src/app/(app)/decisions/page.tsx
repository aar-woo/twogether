import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDecisions } from "./actions";
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

  const { decisions = [] } = await getDecisions(wedding.id);
  return <DecisionQueue decisions={decisions} currentUserId={user.id} />;
}

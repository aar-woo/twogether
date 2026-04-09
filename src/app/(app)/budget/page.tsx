import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "./actions";
import { BudgetClient } from "./BudgetClient";

export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, name, total_budget")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const { categories } = await getCategories(wedding.id);

  return (
    <BudgetClient
      wedding={{
        id: wedding.id,
        name: wedding.name,
        totalBudget: wedding.total_budget ?? 0,
      }}
      categories={categories ?? []}
    />
  );
}

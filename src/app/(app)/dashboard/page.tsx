import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeBanner } from "./WelcomeBanner";
import { MilestoneGrid } from "./MilestoneGrid";
import { Milestone } from "../../../../types/index";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, name, total_budget, dismissed_welcome")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const [milestonesRes, categoriesRes] = await Promise.all([
    supabase.from("milestones").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("budget_categories")
      .select("allocated_amount, expenses(amount, status)"),
  ]);

  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const categories = categoriesRes.data ?? [];

  const totalBudget = wedding.total_budget ?? 0;
  const allocated = categories.reduce(
    (sum, c) => sum + (c.allocated_amount ?? 0),
    0
  );
  const spent = categories
    .flatMap(
      (c) =>
        (c.expenses as Array<{ amount: number; status: string }> | null) ?? []
    )
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const remaining = totalBudget - spent;
  const budgetEmpty = totalBudget === 0;

  const budgetCards = [
    { label: "Total Budget", value: totalBudget },
    { label: "Allocated", value: allocated },
    { label: "Spent", value: spent },
    { label: "Remaining", value: remaining },
  ];

  return (
    <div>
      {!wedding.dismissed_welcome && <WelcomeBanner />}

      <h1 className="font-serif text-3xl text-foreground mb-6">{wedding.name}</h1>

      <div className={budgetEmpty ? "opacity-60" : ""}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          {budgetCards.map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <span className="text-2xl font-semibold text-foreground">
                  {formatCurrency(value)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
        {budgetEmpty && (
          <p className="text-sm text-muted-foreground mb-8">
            <a
              href="/settings"
              className="underline underline-offset-2 text-[#C4714A] hover:opacity-80 transition-opacity"
            >
              Set in Settings →
            </a>
          </p>
        )}
      </div>

      {!budgetEmpty && <div className="mb-8" />}

      <section>
        <h2 className="font-serif text-xl text-foreground mb-4">Progress Map</h2>
        <MilestoneGrid milestones={milestones} />
      </section>
    </div>
  );
}

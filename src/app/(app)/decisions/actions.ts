"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DecisionWithOptions } from "../../../../types/index";

export async function getDecisions(weddingId: string): Promise<{
  decisions?: DecisionWithOptions[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: decisions, error } = await supabase
    .from("decisions")
    .select(
      `
      id, title, category, status, sort_order, resolved_option_id, wedding_id, created_at,
      decision_options!decision_options_decision_id_fkey (
        id, label, decision_id, created_at,
        votes ( id, user_id, rating, option_id, comment, created_at )
      )
    `,
    )
    .eq("wedding_id", weddingId)
    .order("status", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) return { error: error.message };

  return {
    decisions: (decisions ?? []) as unknown as DecisionWithOptions[],
  };
}

export async function createDecision(
  title: string,
  category: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: member, error: memberError } = await supabase
      .from("wedding_members")
      .select("wedding_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) return { error: "No wedding found" };

    const { data: lastDecision } = await supabase
      .from("decisions")
      .select("sort_order")
      .eq("wedding_id", member.wedding_id)
      .eq("status", "open")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrder = lastDecision ? lastDecision.sort_order : 0;

    const { error } = await supabase.from("decisions").insert({
      wedding_id: member.wedding_id,
      title,
      category: category || null,
      status: "open",
      sort_order: maxOrder + 1,
    });

    if (error) return { error: error.message };

    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function reorderDecision(
  id: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: current, error: fetchError } = await supabase
      .from("decisions")
      .select("sort_order, status")
      .eq("id", id)
      .single();

    if (fetchError || !current) return { error: "Decision not found" };

    const neighborOrder =
      direction === "up" ? current.sort_order - 1 : current.sort_order + 1;

    const { data: neighbor } = await supabase
      .from("decisions")
      .select("id, sort_order")
      .eq("status", current.status)
      .eq("sort_order", neighborOrder)
      .maybeSingle();

    if (!neighbor) return {};

    // Swap sort_orders
    const { error: err1 } = await supabase
      .from("decisions")
      .update({ sort_order: neighborOrder })
      .eq("id", id);

    if (err1) return { error: err1.message };

    const { error: err2 } = await supabase
      .from("decisions")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbor.id);

    if (err2) return { error: err2.message };

    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

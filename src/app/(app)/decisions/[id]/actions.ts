"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addOption(
  decisionId: string,
  label: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("decision_options")
      .insert({ decision_id: decisionId, label });

    if (error) return { error: error.message };

    revalidatePath(`/decisions/${decisionId}`);
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function upsertVote(
  optionId: string,
  decisionId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("votes").upsert(
      {
        option_id: optionId,
        user_id: user.id,
        rating,
        comment: comment || null,
      },
      { onConflict: "option_id,user_id" }
    );

    if (error) return { error: error.message };

    revalidatePath(`/decisions/${decisionId}`);
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function resolveDecision(
  decisionId: string,
  winningOptionId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("decisions")
      .update({ status: "resolved", resolved_option_id: winningOptionId })
      .eq("id", decisionId);

    if (error) return { error: error.message };

    revalidatePath(`/decisions/${decisionId}`);
    revalidatePath("/decisions");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

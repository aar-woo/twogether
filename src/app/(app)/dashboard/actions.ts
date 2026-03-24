"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function dismissWelcomeBanner(): Promise<{ error?: string }> {
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

    const { error } = await supabase
      .from("weddings")
      .update({ dismissed_welcome: true })
      .eq("id", member.wedding_id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}

export async function toggleMilestoneStatus(
  id: string,
  newStatus: "not_started" | "in_progress" | "complete"
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("milestones")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}

export async function saveMilestoneNote(
  id: string,
  notes: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("milestones")
      .update({ notes })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}

export async function addMilestone(title: string): Promise<{ error?: string }> {
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

    const { data: lastMilestone } = await supabase
      .from("milestones")
      .select("sort_order")
      .eq("wedding_id", member.wedding_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = lastMilestone ? lastMilestone.sort_order + 1 : 10;

    const { error } = await supabase.from("milestones").insert({
      wedding_id: member.wedding_id,
      title,
      status: "not_started",
      is_default: false,
      sort_order: sortOrder,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "An unexpected error occurred" };
  }
}

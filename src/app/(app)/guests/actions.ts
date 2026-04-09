"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Guest } from "../../../../types/index";

export async function getGuests(weddingId: string): Promise<{
  guests?: Guest[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("guests")
    .select("id, name, side, relationship, invited, wedding_id, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  return { guests: data ?? [] };
}

export async function createGuest(
  name: string,
  side: string | null,
  relationship: string | null,
  invited: boolean,
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

    const { error } = await supabase.from("guests").insert({
      wedding_id: member.wedding_id,
      name,
      side,
      relationship,
      invited,
    });

    if (error) return { error: error.message };

    revalidatePath("/guests");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function updateGuest(
  id: string,
  updates: Partial<Pick<Guest, "name" | "side" | "relationship" | "invited">>,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("guests")
      .update(updates)
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/guests");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function deleteGuest(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("guests").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/guests");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

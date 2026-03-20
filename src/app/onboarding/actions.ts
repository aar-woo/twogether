"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWeddingAction(
  _prevState: { error?: string },
  formData: FormData
) {
  try {
    const weddingName = formData.get("wedding_name") as string;

    if (!weddingName?.trim()) return { error: "Wedding name is required" };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Create the wedding record
    const { data: wedding, error: weddingErr } = await supabase
      .from("weddings")
      .insert({ name: weddingName.trim(), created_by: user.id })
      .select("id")
      .single();

    if (weddingErr) return { error: weddingErr.message };

    // Add the user as the owner member
    const { error: memberErr } = await supabase
      .from("wedding_members")
      .insert({ wedding_id: wedding.id, user_id: user.id, role: "owner" });

    if (memberErr) return { error: memberErr.message };

    redirect("/dashboard");
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "Failed to create wedding. Please try again." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CategoryWithExpenses,
  ExpenseStatus,
} from "../../../../types/index";

export async function getCategories(weddingId: string): Promise<{
  categories?: CategoryWithExpenses[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: categories, error } = await supabase
    .from("budget_categories")
    .select(
      `
      id, wedding_id, name, allocated_amount, created_at,
      expenses ( id, budget_category_id, vendor_name, amount, date, status, note, created_at )
    `,
    )
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  return {
    categories: (categories ?? []) as unknown as CategoryWithExpenses[],
  };
}

export async function createCategory(
  name: string,
  allocatedAmount: number,
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

    const { error } = await supabase.from("budget_categories").insert({
      wedding_id: member.wedding_id,
      name,
      allocated_amount: allocatedAmount,
    });

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function updateCategory(
  id: string,
  name: string,
  allocatedAmount: number,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("budget_categories")
      .update({ name, allocated_amount: allocatedAmount })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function createExpense(
  categoryId: string,
  vendorName: string,
  amount: number,
  status: ExpenseStatus,
  date: string | null,
  note: string | null,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("expenses").insert({
      budget_category_id: categoryId,
      vendor_name: vendorName,
      amount,
      status,
      date: date || null,
      note: note || null,
    });

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function updateExpense(
  id: string,
  vendorName: string,
  amount: number,
  status: ExpenseStatus,
  date: string | null,
  note: string | null,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("expenses")
      .update({
        vendor_name: vendorName,
        amount,
        status,
        date: date || null,
        note: note || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

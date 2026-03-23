"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signupAction(
  _prevState: { error?: string },
  formData: FormData
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return { error: "Email and password are required" };
    if (password.length < 6) return { error: "Password must be at least 6 characters" };

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Signup failed" };

    redirect("/onboarding");
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: "An unexpected error occurred" };
  }
}

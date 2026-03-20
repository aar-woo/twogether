import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard 1: not authenticated → send to login
  if (!user) redirect("/login");

  // Guard 2: already has a wedding → send to dashboard
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-foreground tracking-tight">
            Let&apos;s get started
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Tell us about your wedding — you can add more details later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}

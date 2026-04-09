import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuests } from "./actions";
import { GuestClient } from "./GuestClient";

export default async function GuestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, name")
    .maybeSingle();

  if (!wedding) redirect("/onboarding");

  const { guests } = await getGuests(wedding.id);

  return (
    <GuestClient
      weddingId={wedding.id}
      guests={guests ?? []}
    />
  );
}

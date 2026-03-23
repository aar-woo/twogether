import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          <span className="font-serif text-xl text-foreground">Twogether</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
            <a href="/decisions" className="hover:text-foreground transition-colors">Decisions</a>
            <a href="/budget" className="hover:text-foreground transition-colors">Budget</a>
            <a href="/guests" className="hover:text-foreground transition-colors">Guests</a>
            <a href="/settings" className="hover:text-foreground transition-colors">Settings</a>
          </div>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-3 text-gray-600">
          Configure Supabase env variables to enable authenticated dashboard
          behavior.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="app-page min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-5xl p-6 md:p-8">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-muted-foreground">Welcome back. Track your resume optimization workflow from here.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Analyses</p><p className="text-3xl font-bold mt-2">0</p></div>
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Saved CVs</p><p className="text-3xl font-bold mt-2">0</p></div>
          <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Readiness</p><p className="text-3xl font-bold mt-2">0%</p></div>
        </div>
      </div>
    </main>
  );
}

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
    <main className="mx-auto min-h-screen w-full max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-3 text-gray-600">
        Auth foundation complete. UI parity migration will replace this temporary
        shell.
      </p>
    </main>
  );
}

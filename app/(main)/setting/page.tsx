import { redirect } from "next/navigation";
import { SettingsSecurityForm } from "@/components/forms/settings-security-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SettingPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="app-page min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-300">
          Supabase is not configured. Add environment variables to use account settings.
        </div>
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
    <main className="app-page min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Account <span className="text-display font-serif italic">Settings</span>
        </h1>
        <p className="mb-6 text-muted-foreground">
          Manage your sign-in credentials and keep your account secure.
        </p>
        <SettingsSecurityForm />
      </div>
    </main>
  );
}

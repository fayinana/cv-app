import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getOrCreateCurrentUserProfile } from "@/lib/server/profile";
import { ProfileEditorForm } from "@/components/forms/profile-editor-form";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="app-page min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            Your <span className="text-display font-serif italic">Profile</span>
          </h1>
          <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-300">
            Supabase is not configured yet. Add environment variables to enable profile persistence.
          </p>
        </div>
      </main>
    );
  }

  const ensured = await getOrCreateCurrentUserProfile();
  if (!ensured.ok) {
    redirect("/login");
  }
  const profile = ensured.ok ? ensured.profile : null;

  return (
    <main className="app-page min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Your <span className="text-display font-serif italic">Profile</span>
        </h1>
        <p className="mb-6 text-muted-foreground">
          Manage your identity details and keep your profile recruiter-ready.
        </p>
        <ProfileEditorForm profile={profile} />
      </div>
    </main>
  );
}

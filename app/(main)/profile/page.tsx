import { redirect } from "next/navigation";
import { updateProfileAction } from "@/app/actions/profile";
import { isSupabaseConfigured } from "@/lib/env";
import { getOrCreateCurrentUserProfile } from "@/lib/server/profile";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl p-8">
        <h1 className="mb-6 text-2xl font-bold">Profile</h1>
        <p className="text-gray-600">
          Set Supabase env variables to enable profile persistence.
        </p>
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
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Your <span className="text-display font-serif italic">Profile</span></h1>
      <p className="mb-6 text-muted-foreground">Manage your identity details and keep your profile up to date.</p>
      <form
        action={async (formData) => {
          "use server";
          await updateProfileAction({
            full_name: String(formData.get("full_name") ?? ""),
            title: String(formData.get("title") ?? ""),
            location: String(formData.get("location") ?? ""),
            bio: String(formData.get("bio") ?? ""),
            phone: String(formData.get("phone") ?? ""),
          });
        }}
        className="space-y-4 rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
      >
        <input
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2"
          placeholder="Full name"
          required
        />
        <input
          name="title"
          defaultValue={profile?.title ?? ""}
          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2"
          placeholder="Title"
        />
        <input
          name="location"
          defaultValue={profile?.location ?? ""}
          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2"
          placeholder="Location"
        />
        <textarea
          name="bio"
          defaultValue={profile?.bio ?? ""}
          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2"
          placeholder="Bio"
          rows={4}
        />
        <input
          name="phone"
          defaultValue={profile?.phone ?? ""}
          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2"
          placeholder="Phone"
        />
        <button className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground" type="submit">
          Save
        </button>
      </form>
      </div>
    </main>
  );
}

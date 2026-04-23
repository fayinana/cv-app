import { redirect } from "next/navigation";
import { updateProfileAction } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
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
        className="space-y-3 rounded border p-4"
      >
        <input
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          className="w-full rounded border px-3 py-2"
          placeholder="Full name"
          required
        />
        <input
          name="title"
          defaultValue={profile?.title ?? ""}
          className="w-full rounded border px-3 py-2"
          placeholder="Title"
        />
        <input
          name="location"
          defaultValue={profile?.location ?? ""}
          className="w-full rounded border px-3 py-2"
          placeholder="Location"
        />
        <textarea
          name="bio"
          defaultValue={profile?.bio ?? ""}
          className="w-full rounded border px-3 py-2"
          placeholder="Bio"
          rows={4}
        />
        <input
          name="phone"
          defaultValue={profile?.phone ?? ""}
          className="w-full rounded border px-3 py-2"
          placeholder="Phone"
        />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">
          Save
        </button>
      </form>
    </main>
  );
}

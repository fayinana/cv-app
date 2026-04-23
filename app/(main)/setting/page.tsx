import { updatePasswordAction } from "@/app/actions/settings";

export default function SettingPage() {
  return (
    <main className="app-page min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="mb-2 text-3xl font-bold">Account Settings</h1>
        <p className="mb-6 text-sm text-gray-600">
          Server Action form for password updates (no useEffect data fetching).
        </p>

        <form
          action={async (formData) => {
            "use server";
            await updatePasswordAction(formData);
          }}
          className="space-y-3"
        >
          <input
            type="password"
            name="password"
            minLength={8}
            required
            className="w-full rounded border px-3 py-2"
            placeholder="New password"
          />
          <button className="rounded bg-black px-4 py-2 text-white" type="submit">
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}

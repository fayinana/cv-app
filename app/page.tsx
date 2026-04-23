import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function Home() {
  let userEmail: string | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">CVSmart `cv-app` foundation</h1>
      <p className="text-gray-600">
        Phase 1 is active: Supabase auth + API contracts are in place, then UI
        parity will be migrated.
      </p>
      <div className="flex flex-wrap gap-3">
        {userEmail ? (
          <>
            <Link className="rounded border px-4 py-2" href="/profile">
              Profile
            </Link>
            <Link className="rounded border px-4 py-2" href="/dashboard">
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link className="rounded border px-4 py-2" href="/login">
              Login
            </Link>
            <Link className="rounded border px-4 py-2" href="/signup">
              Signup
            </Link>
          </>
        )}
        <Link className="rounded border px-4 py-2" href="/analyze">
          Analyze UI
        </Link>
        <Link className="rounded border px-4 py-2" href="/build">
          Build UI
        </Link>
      </div>
      <pre className="rounded bg-gray-100 p-4 text-sm">
        {JSON.stringify(
          {
            authUser: userEmail,
            apiRoutes: [
              "/api/analyze",
              "/api/jobs/recommend",
              "/api/assess/generate",
              "/api/cv/templates",
              "/api/profile",
            ],
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}

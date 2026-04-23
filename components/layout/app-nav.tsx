"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AppNav() {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link className="font-semibold" href="/">
          CVSmart
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/analyze">Analyze</Link>
          <Link href="/build">Build</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/setting">Settings</Link>
          <button type="button" className="rounded border px-2 py-1" onClick={signOut}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type EnsureProfileResult =
  | { ok: true; profile: Profile | null }
  | { ok: false; message: string };

export async function getOrCreateCurrentUserProfile(): Promise<EnsureProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: userError?.message ?? "Unauthorized" };
  }

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, message: readError.message };
  }

  if (existing) {
    return { ok: true, profile: existing as Profile };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        "",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  return { ok: true, profile: inserted as Profile };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  ok: boolean;
  message: string;
};

const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  title: z.string().optional().default(""),
  location: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  twitter: z.string().optional().default(""),
});

const initialProfileActionState: ProfileActionState = {
  ok: false,
  message: "",
};

function normalize(input: FormDataEntryValue | null) {
  return String(input ?? "").trim();
}

export async function updateProfileAction(input: unknown): Promise<ProfileActionState> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile payload." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Unauthorized." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? null,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Profile saved successfully." };
}

export async function updateProfileFromFormAction(
  _prevState: ProfileActionState = initialProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  return updateProfileAction({
    full_name: normalize(formData.get("full_name")),
    title: normalize(formData.get("title")),
    location: normalize(formData.get("location")),
    bio: normalize(formData.get("bio")),
    phone: normalize(formData.get("phone")),
    website: normalize(formData.get("website")),
    linkedin: normalize(formData.get("linkedin")),
    github: normalize(formData.get("github")),
    twitter: normalize(formData.get("twitter")),
  });
}

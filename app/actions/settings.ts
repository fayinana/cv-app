"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

const initialSettingsActionState: SettingsActionState = {
  ok: false,
  message: "",
};

export async function updatePasswordAction(formData: FormData): Promise<SettingsActionState> {
  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: "Password and confirmation do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/setting");
  return { ok: true, message: "Password updated successfully." };
}

export async function updatePasswordFromFormAction(
  _prevState: SettingsActionState = initialSettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return updatePasswordAction(formData);
}

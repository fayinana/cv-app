import { fail, ok } from "@/lib/api-response";
import { getOrCreateCurrentUserProfile } from "@/lib/server/profile";

export async function GET() {
  const ensured = await getOrCreateCurrentUserProfile();
  if (!ensured.ok) {
    const status = ensured.message === "Unauthorized" ? 401 : 500;
    return fail(status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR", ensured.message, status);
  }
  return ok(ensured.profile);
}

import { cvTemplatesRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { generateCvSections } from "@/lib/logic/cv-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = cvTemplatesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid CV template payload", 400);
    }

    const result = await generateCvSections(parsed.data);
    return ok(result);
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process CV template request", 500);
  }
}

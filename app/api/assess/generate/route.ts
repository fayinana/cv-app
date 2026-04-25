import { assessRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { generateAssessment } from "@/lib/logic/assessment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = assessRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid assessment payload", 400);
    }

    const result = await generateAssessment(parsed.data.jobDescription);
    return ok(result);
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process assessment request", 500);
  }
}

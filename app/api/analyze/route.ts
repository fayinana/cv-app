import { analyzeRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid analyze payload", 400);
    }

    return ok({
      structured: {
        overallScore: 72,
        verdict: "Conditional Match",
        strengths: ["API contract wired", "Server-side validation enabled"],
        gaps: ["AI logic placeholder"],
      },
      analysis:
        "Placeholder analysis response. Real analysis logic will be added in phase 2.",
    });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process analysis request", 500);
  }
}

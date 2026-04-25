import { analyzeRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { analyzeResume } from "@/lib/logic/analysis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid analyze payload", 400);
    }

    const result = await analyzeResume(parsed.data);
    return ok(result);
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process analysis request", 500);
  }
}

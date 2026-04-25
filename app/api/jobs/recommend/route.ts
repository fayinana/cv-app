import { jobsRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { recommendJobs } from "@/lib/logic/jobs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = jobsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid jobs payload", 400);
    }

    const result = await recommendJobs(parsed.data.query, parsed.data.location);
    return ok(result);
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process jobs request", 500);
  }
}

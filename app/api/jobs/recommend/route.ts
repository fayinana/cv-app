import { jobsRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = jobsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid jobs payload", 400);
    }

    return ok({
      searchQuery: parsed.data.query,
      jobs: [
        {
          title: "Frontend Engineer",
          company: "Example Corp",
          location: parsed.data.location ?? "Remote",
          link: "https://example.com/jobs/frontend-engineer",
          snippet: "Placeholder job recommendation contract response.",
          source: "placeholder",
        },
      ],
    });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process jobs request", 500);
  }
}

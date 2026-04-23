import { cvTemplatesRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = cvTemplatesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid CV template payload", 400);
    }

    return ok({
      sections: {
        personal: {
          fullName: "Candidate Name",
          title: "Software Engineer",
          email: "candidate@example.com",
          phone: "+251-900-000000",
          location: "Addis Ababa",
          website: "",
        },
        summary:
          "Placeholder improved CV draft. Real generation logic will be added in phase 2.",
        skills: ["React", "TypeScript", "Node.js"],
        experience: [],
        education: [],
        projects: [],
      },
    });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process CV template request", 500);
  }
}

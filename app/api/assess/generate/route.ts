import { assessRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { generateAssessment } from "@/lib/logic/assessment";
import { extractResumeText } from "@/lib/server/resume-extractor";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const jobDescription = String(formData.get("jobDescription") ?? "").trim();
      if (jobDescription.length < 20) {
        return fail("BAD_REQUEST", "Job description required (min 20 chars)", 400);
      }
      const resume = formData.get("resume");
      let resumeText = "";
      if (resume instanceof File) {
        try {
          const extracted = await extractResumeText(resume);
          resumeText = extracted.text;
        } catch {
          // Resume context is optional for assessment generation.
          resumeText = "";
        }
      }
      const result = await generateAssessment(jobDescription, resumeText);
      return ok(result);
    }

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

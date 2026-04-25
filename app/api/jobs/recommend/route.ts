import { jobsRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { recommendJobs, recommendJobsFromResume } from "@/lib/logic/jobs";
import { extractResumeText } from "@/lib/server/resume-extractor";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const location = String(formData.get("location") ?? "").trim();
      const jobDescription = String(formData.get("jobDescription") ?? "").trim();
      const resume = formData.get("resume");
      if (!(resume instanceof File)) {
        return fail("BAD_REQUEST", "Resume file is required for job recommendations", 400);
      }
      if (jobDescription.length < 20) {
        return fail("BAD_REQUEST", "Job description is required (min 20 chars)", 400);
      }
      const extracted = await extractResumeText(resume);
      const result = await recommendJobsFromResume(extracted.text, jobDescription, location || undefined);
      return ok(result);
    }

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

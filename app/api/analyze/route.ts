import { analyzeRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { analyzeResume } from "@/lib/logic/analysis";

export async function POST(req: Request) {
  try {
    let payload: { jobDescription: string; resumeText: string };
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const jobDescription = String(formData.get("jobDescription") ?? "").trim();
      const resume = formData.get("resume");
      if (!(resume instanceof File)) {
        return fail("BAD_REQUEST", "Resume file is required", 400);
      }
      const resumeText = (await resume.text()).trim();
      payload = { jobDescription, resumeText };
    } else {
      const body = await req.json();
      payload = {
        jobDescription: String(body?.jobDescription ?? ""),
        resumeText: String(body?.resumeText ?? ""),
      };
    }

    const parsed = analyzeRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid analyze payload", 400);
    }

    const result = await analyzeResume(parsed.data);
    return ok(result);
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process analysis request", 500);
  }
}

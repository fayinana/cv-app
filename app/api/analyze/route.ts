import { analyzeRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";
import { analyzeResume } from "@/lib/logic/analysis";
import { extractResumeText } from "@/lib/server/resume-extractor";

export async function POST(req: Request) {
  try {
    let payload: { jobDescription: string; resumeText: string; locale?: "en" | "am" | "om" };
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const jobDescription = String(formData.get("jobDescription") ?? "").trim();
      const locale = String(formData.get("locale") ?? "en");
      const resume = formData.get("resume");
      if (!(resume instanceof File)) {
        return fail("BAD_REQUEST", "Resume file is required", 400);
      }
      let resumeText = "";
      try {
        const extracted = await extractResumeText(resume);
        resumeText = extracted.text;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to read resume file. Please upload PDF, DOCX, or TXT.";
        return fail("BAD_REQUEST", message, 400);
      }
      payload = {
        jobDescription,
        resumeText,
        locale: locale === "am" || locale === "om" ? locale : "en",
      };
    } else {
      const body = await req.json();
      payload = {
        jobDescription: String(body?.jobDescription ?? ""),
        resumeText: String(body?.resumeText ?? ""),
        locale: body?.locale === "am" || body?.locale === "om" ? body.locale : "en",
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

import { assessRequestSchema } from "@/lib/contracts";
import { fail, ok } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = assessRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid assessment payload", 400);
    }

    return ok({
      questions: [
        {
          question: "Which practice area should be prioritized first?",
          options: {
            A: "System design",
            B: "Behavioral examples",
            C: "Communication clarity",
            D: "All equally",
          },
          correct: "D",
          explanation: "Placeholder interview prep contract response.",
        },
      ],
    });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to process assessment request", 500);
  }
}

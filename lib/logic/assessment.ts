import { generateJsonWithGemini } from "@/lib/ai/gemini";

type QuizQuestion = {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

function normalizeQuestion(raw: Partial<QuizQuestion>): QuizQuestion | null {
  const question = String(raw.question ?? "").trim();
  const optionsRaw = raw.options ?? { A: "", B: "", C: "", D: "" };
  const options = {
    A: String(optionsRaw.A ?? "").trim(),
    B: String(optionsRaw.B ?? "").trim(),
    C: String(optionsRaw.C ?? "").trim(),
    D: String(optionsRaw.D ?? "").trim(),
  };
  const correct = String(raw.correct ?? "").trim().toUpperCase() as "A" | "B" | "C" | "D";
  const explanation = String(raw.explanation ?? "").trim();

  if (!question || !options.A || !options.B || !options.C || !options.D) return null;
  if (!["A", "B", "C", "D"].includes(correct)) return null;
  return {
    question: question.slice(0, 500),
    options: {
      A: options.A.slice(0, 200),
      B: options.B.slice(0, 200),
      C: options.C.slice(0, 200),
      D: options.D.slice(0, 200),
    },
    correct,
    explanation: explanation.slice(0, 300),
  };
}

export async function generateAssessment(jobDescription: string, resumeText = "") {
  const fallback = {
    questions: [
      {
        question: "Which area should you practice first for this role?",
        options: {
          A: "Core technical fundamentals",
          B: "Domain-specific examples",
          C: "Behavioral storytelling",
          D: "All of the above in balanced order",
        },
        correct: "D" as const,
        explanation:
          "Balanced preparation usually performs best when role expectations are broad.",
      },
    ] satisfies QuizQuestion[],
  };

  const prompt = `
Generate interview preparation multiple-choice questions based on the job description and candidate profile.
Return strictly valid JSON with this shape:
{
  "questions": [
    {
      "question": string,
      "options": {"A": string, "B": string, "C": string, "D": string},
      "correct": "A" | "B" | "C" | "D",
      "explanation": string
    }
  ]
}
Create exactly 6 questions with a balanced mix of:
- role-specific technical or situational
- behavioral
- practical decision-making

Job description:
${jobDescription}

Candidate resume context (optional):
${resumeText.slice(0, 2000)}
`;

  const response = await generateJsonWithGemini<{ questions?: Array<Partial<QuizQuestion>> }>(prompt, fallback);
  const normalized = (Array.isArray(response.questions) ? response.questions : [])
    .map(normalizeQuestion)
    .filter((q): q is QuizQuestion => Boolean(q))
    .slice(0, 6);

  if (!normalized.length) return fallback;
  return { questions: normalized };
}

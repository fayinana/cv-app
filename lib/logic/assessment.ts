import { generateJsonWithGemini } from "@/lib/ai/gemini";

type QuizQuestion = {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

export async function generateAssessment(jobDescription: string) {
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
Generate interview preparation multiple-choice questions.
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
Create 5 questions based on:
${jobDescription}
`;

  return generateJsonWithGemini(prompt, fallback);
}

import { generateJsonWithGemini } from "@/lib/ai/gemini";
import { env } from "@/lib/env";

type StructuredAnalysis = {
  overallScore: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
};

function basicKeywordScore(resumeText: string, jobDescription: string) {
  const resumeWords = new Set(
    resumeText
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((word) => word.length > 2)
  );
  const jobWords = jobDescription
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 2);

  const uniqueJobWords = Array.from(new Set(jobWords));
  const matchCount = uniqueJobWords.filter((word) => resumeWords.has(word)).length;
  const ratio = uniqueJobWords.length ? matchCount / uniqueJobWords.length : 0;
  return Math.min(100, Math.round(35 + ratio * 65));
}

function verdictFromScore(score: number) {
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Conditional Match";
  return "Weak Match";
}

export async function analyzeResume(params: {
  resumeText: string;
  jobDescription: string;
}) {
  const heuristicScore = basicKeywordScore(params.resumeText, params.jobDescription);
  const providerMessage = env.GOOGLE_API_KEY
    ? "Heuristic analysis mode is active because the AI provider did not return a usable response. Check the Google API key permissions, quota, model access, and server logs."
    : "Heuristic analysis mode is active. Configure GOOGLE_API_KEY and restart the dev server for richer AI analysis.";
  const fallback: { structured: StructuredAnalysis; analysis: string } = {
    structured: {
      overallScore: heuristicScore,
      verdict: verdictFromScore(heuristicScore),
      strengths: ["Resume contains role-relevant keywords."],
      gaps: [
        env.GOOGLE_API_KEY
          ? "Detailed AI gap analysis unavailable because the AI provider request failed."
          : "Detailed AI gap analysis unavailable because GOOGLE_API_KEY is not loaded.",
      ],
    },
    analysis: providerMessage,
  };

  const prompt = `
You are a resume analysis assistant.
Return strictly valid JSON with this shape:
{
  "structured": {
    "overallScore": number(0-100),
    "verdict": string,
    "strengths": string[],
    "gaps": string[]
  },
  "analysis": string
}

Job description:
${params.jobDescription}

Resume text:
${params.resumeText}
`;

  return generateJsonWithGemini(prompt, fallback);
}

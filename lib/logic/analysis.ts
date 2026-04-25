import { generateJsonWithGemini } from "@/lib/ai/gemini";

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
  const fallback: { structured: StructuredAnalysis; analysis: string } = {
    structured: {
      overallScore: heuristicScore,
      verdict: verdictFromScore(heuristicScore),
      strengths: ["Resume contains role-relevant keywords."],
      gaps: ["Detailed AI gap analysis unavailable (provider not configured)."],
    },
    analysis:
      "Heuristic analysis mode is active. Configure GOOGLE_API_KEY for richer AI analysis.",
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

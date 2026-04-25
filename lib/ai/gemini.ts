import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";

function parseJsonFromText<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  if (!cleaned) return null;

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const jsonText = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    return null;
  }
}

export async function generateJsonWithGemini<T>(
  prompt: string,
  fallback: T
): Promise<T> {
  if (!env.GOOGLE_API_KEY) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = response.response.text();
    const parsed = parseJsonFromText<T>(text);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

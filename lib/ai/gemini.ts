import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 700;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.map((model) => model.trim()).filter(Boolean)));
}

function getGeminiModels() {
  const configuredPrimary = env.GEMINI_MODEL;
  const configuredFallbacks = env.GEMINI_FALLBACK_MODELS?.split(",") ?? [];
  return uniqueModels([configuredPrimary ?? "", ...configuredFallbacks, ...DEFAULT_GEMINI_MODELS]);
}

function isRetryableGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|500|502|503|504)\b/.test(message) || /overloaded|high demand|temporar/i.test(message);
}

async function generateWithModel<T>(apiKey: string, modelName: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const text = response.response.text();
  return parseJsonFromText<T>(text);
}

export async function generateJsonWithGemini<T>(
  prompt: string,
  fallback: T
): Promise<T> {
  if (!env.GOOGLE_API_KEY) {
    return fallback;
  }

  let lastError: unknown = null;
  for (const modelName of getGeminiModels()) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      try {
        const parsed = await generateWithModel<T>(env.GOOGLE_API_KEY, modelName, prompt);
        if (parsed) return parsed;
        lastError = new Error(`Model ${modelName} returned a response that was not valid JSON.`);
        break;
      } catch (error) {
        lastError = error;
        const retryable = isRetryableGeminiError(error);
        const canRetrySameModel = retryable && attempt < MAX_ATTEMPTS_PER_MODEL;
        console.warn(
          `Gemini generation failed with ${modelName} (attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL}).`,
          error instanceof Error ? error.message : error
        );

        if (!canRetrySameModel) break;
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  console.warn(
    "All Gemini model attempts failed; falling back to heuristic response.",
    lastError instanceof Error ? lastError.message : lastError
  );
  return fallback;
}

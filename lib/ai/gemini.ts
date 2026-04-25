import { env } from "@/lib/env";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  const candidates = Array.isArray(obj.candidates)
    ? (obj.candidates as Array<Record<string, unknown>>)
    : [];
  const first = candidates[0];
  if (!first || typeof first !== "object") return "";
  const content = first.content as Record<string, unknown> | undefined;
  if (!content || !Array.isArray(content.parts)) return "";
  const textPart = content.parts.find(
    (part) =>
      typeof part === "object" &&
      part &&
      typeof (part as Record<string, unknown>).text === "string"
  ) as Record<string, unknown> | undefined;
  return (textPart?.text as string) ?? "";
}

export async function generateJsonWithGemini<T>(
  prompt: string,
  fallback: T
): Promise<T> {
  if (!env.GOOGLE_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${env.GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.3,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as unknown;
    const text = extractText(payload).trim();
    if (!text) return fallback;

    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

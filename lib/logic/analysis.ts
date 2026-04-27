import { generateJsonWithGemini } from "@/lib/ai/gemini";
import { env } from "@/lib/env";

type StructuredAnalysis = {
  overallScore: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
};

type AnalysisLocale = "en" | "am" | "om";
type SingleAnalysisResult = { structured: StructuredAnalysis; analysis: string };
type MultilingualAnalysisResult = SingleAnalysisResult & {
  localized: Record<AnalysisLocale, SingleAnalysisResult>;
};

const LOCALE_INSTRUCTIONS: Record<AnalysisLocale, string> = {
  en: "English",
  am: "Amharic (Ethiopian Amharic, Ge'ez script).",
  om: "Afaan Oromo (Latin script).",
};

const FALLBACK_COPY: Record<
  AnalysisLocale,
  {
    strong: string;
    conditional: string;
    weak: string;
    strength: string;
    providerGap: string;
    missingKeyGap: string;
    providerMessage: string;
    missingKeyMessage: string;
  }
> = {
  en: {
    strong: "Strong Match",
    conditional: "Conditional Match",
    weak: "Weak Match",
    strength: "Resume contains role-relevant keywords.",
    providerGap: "Detailed AI gap analysis unavailable because the AI provider request failed.",
    missingKeyGap: "Detailed AI gap analysis unavailable because GOOGLE_API_KEY is not loaded.",
    providerMessage:
      "Heuristic analysis mode is active because the AI provider did not return a usable response. Check the Google API key permissions, quota, model access, and server logs.",
    missingKeyMessage:
      "Heuristic analysis mode is active. Configure GOOGLE_API_KEY and restart the dev server for richer AI analysis.",
  },
  am: {
    strong: "ጠንካራ ተዛማጅ",
    conditional: "መካከለኛ ተዛማጅ",
    weak: "ደካማ ተዛማጅ",
    strength: "CVው ከስራው ጋር የሚዛመዱ ቁልፍ ቃላትን ይዟል።",
    providerGap: "ዝርዝር የAI ክፍተት ትንታኔ አልተገኘም፤ የAI አገልግሎት ጥያቄው አልተሳካም።",
    missingKeyGap: "ዝርዝር የAI ክፍተት ትንታኔ አልተገኘም፤ GOOGLE_API_KEY አልተጫነም።",
    providerMessage:
      "የመሠረታዊ ትንታኔ ሁነታ ተጠቅሟል፤ የAI አገልግሎት ተጠቃሚ መልስ አልመለሰም። የGoogle API key ፈቃዶችን፣ ኮታን፣ የሞዴል መዳረሻን እና የserver logs ይመልከቱ።",
    missingKeyMessage:
      "የመሠረታዊ ትንታኔ ሁነታ ተጠቅሟል። GOOGLE_API_KEY ያዋቅሩ እና dev server እንደገና ያስጀምሩ።",
  },
  om: {
    strong: "Walsimannaa cimaa",
    conditional: "Walsimannaa giddu galeessaa",
    weak: "Walsimannaa laafaa",
    strength: "CV'n jechoota ijoo hojii wajjin walsiman qaba.",
    providerGap: "Xiinxalli hanqina AI bal'aan hin argamne; gaaffiin tajaajila AI hin milkoofne.",
    missingKeyGap: "Xiinxalli hanqina AI bal'aan hin argamne; GOOGLE_API_KEY hin fe'amne.",
    providerMessage:
      "Haalli xiinxala salphaa hojiirra ooleera; tajaajilli AI deebii fayyadamuu danda'amu hin deebisne. Hayyama Google API key, quota, model access, fi server logs ilaali.",
    missingKeyMessage:
      "Haalli xiinxala salphaa hojiirra ooleera. GOOGLE_API_KEY qindeessi, sana booda dev server irra deebi'i jalqabsiisi.",
  },
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

function verdictFromScore(score: number, locale: AnalysisLocale) {
  const copy = FALLBACK_COPY[locale];
  if (score >= 75) return copy.strong;
  if (score >= 50) return copy.conditional;
  return copy.weak;
}

function buildFallback(locale: AnalysisLocale, heuristicScore: number): SingleAnalysisResult {
  const copy = FALLBACK_COPY[locale];
  const providerMessage = env.GOOGLE_API_KEY
    ? copy.providerMessage
    : copy.missingKeyMessage;
  return {
    structured: {
      overallScore: heuristicScore,
      verdict: verdictFromScore(heuristicScore, locale),
      strengths: [copy.strength],
      gaps: [
        env.GOOGLE_API_KEY
          ? copy.providerGap
          : copy.missingKeyGap,
      ],
    },
    analysis: providerMessage,
  };
}

function buildMultilingualFallback(heuristicScore: number, preferredLocale: AnalysisLocale): MultilingualAnalysisResult {
  const localized = {
    en: buildFallback("en", heuristicScore),
    am: buildFallback("am", heuristicScore),
    om: buildFallback("om", heuristicScore),
  };
  return {
    ...localized[preferredLocale],
    localized,
  };
}

export async function analyzeResume(params: {
  resumeText: string;
  jobDescription: string;
  locale?: AnalysisLocale;
}) {
  const locale = params.locale ?? "en";
  const heuristicScore = basicKeywordScore(params.resumeText, params.jobDescription);
  const fallback = buildMultilingualFallback(heuristicScore, locale);

  const prompt = `
You are a resume analysis assistant.
Create the same resume analysis in all supported languages in one response.
Only JSON object keys must stay in English.
Use these output languages:
- localized.en values: ${LOCALE_INSTRUCTIONS.en}
- localized.am values: ${LOCALE_INSTRUCTIONS.am}
- localized.om values: ${LOCALE_INSTRUCTIONS.om}

Keep the numeric score consistent across all languages.
Return strictly valid JSON with this shape:
{
  "structured": {
    "overallScore": number(0-100),
    "verdict": string,
    "strengths": string[],
    "gaps": string[]
  },
  "analysis": string,
  "localized": {
    "en": {
      "structured": {
        "overallScore": number(0-100),
        "verdict": string,
        "strengths": string[],
        "gaps": string[]
      },
      "analysis": string
    },
    "am": {
      "structured": {
        "overallScore": number(0-100),
        "verdict": string,
        "strengths": string[],
        "gaps": string[]
      },
      "analysis": string
    },
    "om": {
      "structured": {
        "overallScore": number(0-100),
        "verdict": string,
        "strengths": string[],
        "gaps": string[]
      },
      "analysis": string
    }
  }
}

Set the top-level "structured" and "analysis" to the ${locale} version.

Job description:
${params.jobDescription}

Resume text:
${params.resumeText}
`;

  return generateJsonWithGemini(prompt, fallback);
}

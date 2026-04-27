"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Download,
  ExternalLink,
  FileText,
  FilePlus2,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { postJson } from "@/lib/fetchers";
import { exportElementToPdf } from "@/lib/pdf-export";
import { exportCvDataToDocx } from "@/lib/docx-export";
import { TEMPLATE_MAP, type CVData, type TemplateId } from "@/components/cv-templates";
import { useLocaleSwitch } from "@/components/providers/i18n-provider";

type Step = 1 | 2 | 3;
type Status = "idle" | "running" | "success" | "error";

type AnalyzeResult = {
  structured: {
    overallScore: number;
    verdict: string;
    strengths: string[];
    gaps: string[];
  };
  analysis: string;
  localized?: Record<"en" | "am" | "om", {
    structured: {
      overallScore: number;
      verdict: string;
      strengths: string[];
      gaps: string[];
    };
    analysis: string;
  }>;
};

type SingleAnalyzeResult = Omit<AnalyzeResult, "localized">;

type JobRecommendation = {
  title: string;
  company: string;
  location: string;
  link: string;
  snippet: string;
  source?: string;
};

type QuizQuestion = {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

type GenerateCvResponse = { sections: CVData };

type AnalyzeState = {
  step: Step;
  status: Status;
  progress: number;
  resumeFileName: string | null;
  jobDescription: string;
  result: AnalyzeResult | null;
  error: string | null;
  restoredNotice: string | null;
  locale: "en" | "am" | "om";
};

type PersistedAnalyzeDraft =
  | AnalyzeState
  | {
      version: 2;
      savedAt: number;
      expiresAt: number;
      state: AnalyzeState;
    };

type Action =
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_FILE"; payload: string | null }
  | { type: "SET_JOB"; payload: string }
  | { type: "RUN_START" }
  | { type: "RUN_PROGRESS"; payload: number }
  | { type: "RUN_SUCCESS"; payload: { result: AnalyzeResult; locale: "en" | "am" | "om" } }
  | { type: "RUN_ERROR"; payload: string }
  | { type: "RESTORE"; payload: AnalyzeState }
  | { type: "CLEAR_NOTICE" }
  | { type: "SET_LOCALE"; payload: "en" | "am" | "om" }
  | { type: "CLEAR_LOCALIZED_OUTPUT"; payload: "en" | "am" | "om" }
  | { type: "RESET_ALL" };

const STORAGE_KEY = "cvsmart.analysis.workflow.v1";
const DRAFT_TTL_MS = 30 * 60 * 1000;
const RESUME_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const initialState: AnalyzeState = {
  step: 1,
  status: "idle",
  progress: 0,
  resumeFileName: null,
  jobDescription: "",
  result: null,
  error: null,
  restoredNotice: null,
  locale: "en",
};

function reducer(state: AnalyzeState, action: Action): AnalyzeState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_FILE":
      return { ...state, resumeFileName: action.payload };
    case "SET_JOB":
      return { ...state, jobDescription: action.payload };
    case "RUN_START":
      return { ...state, step: 3, status: "running", progress: 5, result: null, error: null };
    case "RUN_PROGRESS":
      return { ...state, progress: Math.min(95, action.payload) };
    case "RUN_SUCCESS":
      return { ...state, status: "success", progress: 100, result: action.payload.result, error: null, step: 3, locale: action.payload.locale };
    case "RUN_ERROR":
      return { ...state, status: "error", progress: 0, error: action.payload, step: 3 };
    case "RESTORE":
      return action.payload;
    case "CLEAR_NOTICE":
      return { ...state, restoredNotice: null };
    case "SET_LOCALE":
      return { ...state, locale: action.payload };
    case "CLEAR_LOCALIZED_OUTPUT":
      return {
        ...state,
        step: 1,
        status: "idle",
        progress: 0,
        result: null,
        error: null,
        restoredNotice: null,
        locale: action.payload,
      };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

function readPersistedState(
  copy: { interrupted: string; recovered: string; expired: string },
  currentLocale: "en" | "am" | "om"
): AnalyzeState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedAnalyzeDraft;
    const now = Date.now();
    const isEnvelope = "state" in parsed && "expiresAt" in parsed;
    const draftState = isEnvelope ? parsed.state : parsed;
    const expiresAt = isEnvelope ? parsed.expiresAt : now + DRAFT_TTL_MS;

    if (Number.isFinite(expiresAt) && expiresAt <= now) {
      window.localStorage.removeItem(STORAGE_KEY);
      toast.info(copy.expired);
      return null;
    }

    const hasLocaleResult = Boolean(draftState.result?.localized?.[currentLocale]);
    if (draftState.locale && draftState.locale !== currentLocale && !hasLocaleResult) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const stateForLocale = {
      ...draftState,
      step: 1 as Step,
      resumeFileName: null,
      locale: draftState.locale ?? currentLocale,
    };
    if (draftState.status === "running") {
      return {
        ...stateForLocale,
        status: "error",
        progress: 0,
        error: copy.interrupted,
        restoredNotice: copy.recovered,
      };
    }
    return { ...stateForLocale, restoredNotice: copy.recovered };
  } catch {
    return null;
  }
}

function scoreTone(score: number): "good" | "mid" | "low" {
  if (score >= 75) return "good";
  if (score >= 50) return "mid";
  return "low";
}

function getResumeFileError(file: File, copy: { invalidType: string; tooLarge: string }): string | null {
  const fileName = file.name.toLowerCase();
  if (!RESUME_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    return copy.invalidType;
  }
  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    return copy.tooLarge;
  }
  return null;
}

function templateLabel(templateId: TemplateId, labels: Record<TemplateId, string>) {
  return labels[templateId];
}

function hasPersistableDraft(state: AnalyzeState) {
  return Boolean(
    state.jobDescription.trim() ||
      state.result ||
      state.status === "running" ||
      state.status === "error"
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, score));
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dash = (normalized / 100) * circumference;
  const tone = scoreTone(normalized);
  const ringColor = tone === "good" ? "#00e5a0" : tone === "mid" ? "#f5a524" : "#f43f5e";
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="9" fill="none" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke={ringColor}
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold">{normalized}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MiniBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-muted/30">
      <div className="h-full rounded transition-all duration-700" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

export function AnalyzeWorkflowForm() {
  const t = useTranslations("analyze");
  const { locale } = useLocaleSwitch();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "actions" | "cv">("overview");
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsSearchQuery, setJobsSearchQuery] = useState("");
  const [jobsWarning, setJobsWarning] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [cvSections, setCvSections] = useState<CVData | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [cvLoading, setCvLoading] = useState(false);
  const [downloadingCvPdf, setDownloadingCvPdf] = useState(false);
  const [downloadingCvDocx, setDownloadingCvDocx] = useState(false);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const restoredDraftRef = useRef(false);
  const [resumeFile, setResumeFile] = useReducer(
    (_: File | null, next: File | null) => next,
    null
  );
  const templateLabels: Record<TemplateId, string> = {
    classic: t("templates.classic"),
    modern: t("templates.modern"),
    minimal: t("templates.minimal"),
  };
  const tabLabels: Record<"overview" | "breakdown" | "actions" | "cv", string> = {
    overview: t("tabs.overview"),
    breakdown: t("tabs.breakdown"),
    actions: t("tabs.actions"),
    cv: t("tabs.cv"),
  };
  const docxLabels = {
    candidateName: t("docx.candidateName"),
    summary: t("docx.summary"),
    skills: t("docx.skills"),
    experience: t("docx.experience"),
    education: t("docx.education"),
    projects: t("docx.projects"),
  };

  useEffect(() => {
    if (restoredDraftRef.current) return;
    const restored = readPersistedState({
      interrupted: t("messages.interrupted"),
      recovered: t("messages.recovered"),
      expired: t("messages.draftExpired"),
    }, locale);
    if (restored) {
      restoredDraftRef.current = true;
      dispatch({ type: "RESTORE", payload: restored });
      toast.info(t("messages.recoveredToast"));
    }
  }, [locale, t]);

  useEffect(() => {
    if (state.locale === locale) return;
    if (state.result?.localized?.[locale] || !state.result) {
      dispatch({ type: "SET_LOCALE", payload: locale });
      return;
    }

    dispatch({ type: "SET_LOCALE", payload: locale });
    toast.info(t("messages.languageChanged"));
  }, [locale, state.locale, state.result, t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasPersistableDraft(state)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const savedAt = Date.now();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        savedAt,
        expiresAt: savedAt + DRAFT_TTL_MS,
        state,
      })
    );
  }, [state]);

  const canGoStep2 = Boolean(resumeFile);
  const canAnalyze = canGoStep2 && state.jobDescription.trim().length >= 20;
  const CvPreviewComponent = cvSections ? TEMPLATE_MAP[templateId] : null;
  const activeResult: SingleAnalyzeResult | null =
    state.result?.localized?.[locale] ?? state.result;

  const scoreColor = useMemo(() => {
    const score = activeResult?.structured.overallScore ?? 0;
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-300";
    return "text-rose-400";
  }, [activeResult?.structured.overallScore]);

  const acceptResumeFile = (file: File | null) => {
    if (!file) return;
    const error = getResumeFileError(file, {
      invalidType: t("validation.invalidFileType"),
      tooLarge: t("validation.fileTooLarge"),
    });
    if (error) {
      toast.error(error);
      return;
    }
    setResumeFile(file);
    dispatch({ type: "SET_FILE", payload: file.name });
    toast.success(t("messages.resumeSelected"));
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    acceptResumeFile(file);
  };

  const onResumeDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingResume(false);
    acceptResumeFile(event.dataTransfer.files?.[0] ?? null);
  };

  const runAnalyze = async () => {
    if (!canAnalyze) {
      toast.error(t("validation.resumeAndJobRequired"));
      return;
    }
    if (!resumeFile) {
      toast.error(t("validation.resumeRequired"));
      return;
    }

    dispatch({ type: "RUN_START" });
    setCvSections(null);

    let progress = 5;
    const timer = window.setInterval(() => {
      progress += 5;
      dispatch({ type: "RUN_PROGRESS", payload: progress });
    }, 250);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", state.jobDescription.trim());
      formData.append("locale", locale);
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      let payload: { data?: AnalyzeResult; error?: { message?: string } } | null = null;
      const responseType = response.headers.get("content-type") || "";
      if (responseType.includes("application/json")) {
        payload = (await response.json()) as { data?: AnalyzeResult; error?: { message?: string } };
      } else {
        const nonJsonBody = await response.text();
        throw new Error(
          nonJsonBody.includes("<!DOCTYPE")
            ? t("errors.unexpectedHtml")
            : t("errors.unexpectedFormat")
        );
      }

      if (!response.ok || payload.error || !payload.data) {
        throw new Error(payload.error?.message || t("errors.analysisFailed"));
      }
      const data = payload.data;
      dispatch({ type: "RUN_SUCCESS", payload: { result: data, locale } });
      setActiveTab("overview");
      setCvSections(null);
      toast.success(t("messages.analysisComplete"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.analysisFailed");
      dispatch({ type: "RUN_ERROR", payload: message });
      toast.error(message);
    } finally {
      window.clearInterval(timer);
    }
  };

  const loadJobRecommendations = async () => {
    if (!resumeFile || !state.jobDescription.trim()) {
      toast.error(t("validation.uploadAndJobFirst"));
      return;
    }
    setJobsLoading(true);
    setJobsWarning(null);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", state.jobDescription.trim());
      formData.append("location", "Ethiopia");
      const response = await fetch("/api/jobs/recommend", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        data?: { jobs?: JobRecommendation[]; searchQuery?: string; warning?: string };
        error?: { message?: string };
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message || t("errors.jobsFailed"));
      }
      const list = payload.data?.jobs ?? [];
      setJobs(list);
      setJobsSearchQuery(payload.data?.searchQuery ?? "");
      setJobsWarning(payload.data?.warning ?? null);
      if (!list.length) {
        toast.info(t("messages.noJobs"));
      } else {
        toast.success(t("messages.jobsReady"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.jobsFailed");
      setJobsWarning(message);
      toast.error(message);
    } finally {
      setJobsLoading(false);
    }
  };

  const generateInterviewQuiz = async () => {
    if (!state.jobDescription.trim() || state.jobDescription.trim().length < 20) {
      toast.error(t("validation.jobFirst"));
      return;
    }
    setQuizLoading(true);
    setQuizSubmitted(false);
    setQuizAnswers({});
    try {
      const formData = new FormData();
      formData.append("jobDescription", state.jobDescription.trim());
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
      const response = await fetch("/api/assess/generate", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        data?: { questions?: QuizQuestion[] };
        error?: { message?: string };
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message || t("errors.quizFailed"));
      }
      const questions = payload.data?.questions ?? [];
      setQuizQuestions(questions);
      if (!questions.length) {
        toast.info(t("messages.noQuiz"));
      } else {
        toast.success(t("messages.quizReady"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.quizFailed");
      toast.error(message);
    } finally {
      setQuizLoading(false);
    }
  };

  const generateImprovedCv = async () => {
    if (!activeResult) {
      toast.error(t("validation.analysisFirst"));
      return;
    }
    setCvLoading(true);
    try {
      const analysisContext = [
        activeResult.analysis,
        activeResult.structured.strengths.length
          ? `${t("results.strengths")}:\n${activeResult.structured.strengths.map((item) => `- ${item}`).join("\n")}`
          : "",
        activeResult.structured.gaps.length
          ? `${t("results.gapsToAddress")}:\n${activeResult.structured.gaps.map((item) => `- ${item}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const payload = await postJson<GenerateCvResponse, { jobDescription: string; analysis: string }>(
        "/api/cv/templates",
        {
          jobDescription: state.jobDescription.trim(),
          analysis: analysisContext,
        }
      );
      setCvSections(payload.sections);
      setActiveTab("cv");
      toast.success(t("messages.cvGenerated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.cvFailed"));
    } finally {
      setCvLoading(false);
    }
  };

  const exportImprovedCvPdf = async () => {
    if (!cvPreviewRef.current) {
      toast.error(t("validation.cvFirst"));
      return;
    }
    setDownloadingCvPdf(true);
    try {
      await exportElementToPdf({
        element: cvPreviewRef.current,
        filename: "improved_cv.pdf",
      });
      toast.success(t("messages.pdfStarted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.pdfFailed"));
    } finally {
      setDownloadingCvPdf(false);
    }
  };

  const exportImprovedCvDocx = async () => {
    if (!cvSections) {
      toast.error(t("validation.cvFirst"));
      return;
    }
    setDownloadingCvDocx(true);
    try {
      await exportCvDataToDocx(cvSections, docxLabels, "improved_cv.docx");
      toast.success(t("messages.docxStarted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.docxFailed"));
    } finally {
      setDownloadingCvDocx(false);
    }
  };

  const quizScore = quizSubmitted
    ? quizQuestions.reduce((score, question, index) => {
        return quizAnswers[index] === question.correct ? score + 1 : score;
      }, 0)
    : 0;

  const stepMeta: Array<{ id: Step; label: string }> = [
    { id: 1, label: t("steps.upload") },
    { id: 2, label: t("steps.job") },
    { id: 3, label: t("steps.results") },
  ];
  const completedThrough =
    state.step === 3 ? (state.status === "success" ? 3 : 2) : state.step === 2 ? 1 : 0;
  const sectionItems = useMemo(() => {
    const result = activeResult?.structured;
    if (!result) return [];
    const overall = Math.max(0, Math.min(100, result.overallScore));
    return [
      {
        id: "technical",
        label: t("results.technicalAlignment"),
        score: overall,
        color: "#00e5a0",
        details: result.strengths.slice(0, 3).length ? result.strengths.slice(0, 3) : [t("results.technicalFallback")],
      },
      {
        id: "experience",
        label: t("results.experienceMatch"),
        score: Math.max(0, Math.min(100, overall - 6)),
        color: "#ff4d6d",
        details: [t("results.experienceFallback")],
      },
      {
        id: "projects",
        label: t("results.projectRelevance"),
        score: Math.max(0, Math.min(100, overall - 3)),
        color: "#00b4d8",
        details: [t("results.projectFallback")],
      },
      {
        id: "communication",
        label: t("results.communicationFit"),
        score: Math.max(0, Math.min(100, overall - 8)),
        color: "#f5a524",
        details: result.gaps.slice(0, 2).length ? result.gaps.slice(0, 2) : [t("results.communicationFallback")],
      },
    ];
  }, [activeResult, t]);

  return (
    <div className="space-y-8">
      {state.restoredNotice ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.restoredNotice}
          <button
            className="ml-2 underline"
            type="button"
            onClick={() => dispatch({ type: "CLEAR_NOTICE" })}
          >
            {t("actions.dismiss")}
          </button>
        </div>
      ) : null}

      <div className="relative mx-auto w-full max-w-2xl px-2">
        <div className="absolute left-0 right-0 top-5 h-px bg-border" />
        <div
          className="absolute left-0 top-5 h-px bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(100, (completedThrough / 2) * 100)}%` }}
        />
        <div className="relative flex items-start justify-between">
          {stepMeta.map((item) => {
            const active = state.step === item.id;
            const done = completedThrough >= item.id;
            const isLoadingNode = item.id === 3 && state.status === "running";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: "SET_STEP", payload: item.id })}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    done && !isLoadingNode
                      ? "border-emerald-500 bg-emerald-500 text-black"
                      : active || isLoadingNode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done && !active && !isLoadingNode ? (
                    <Check className="h-5 w-5" />
                  ) : isLoadingNode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    item.id
                  )}
                </span>
                <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {state.step === 1 ? (
        <Card className="mx-auto max-w-3xl overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t("upload.title")}</CardTitle>
            <CardDescription>{t("upload.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
                isDraggingResume
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-muted/30 hover:bg-muted/40"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingResume(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setIsDraggingResume(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingResume(false);
              }}
              onDrop={onResumeDrop}
            >
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={onFileChange} />
              <span className="mb-3 rounded-full border border-border bg-background/80 p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {resumeFile
                  ? resumeFile.name
                  : isDraggingResume
                    ? t("upload.dropHere")
                    : t("upload.prompt")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("upload.help")}</p>
            </label>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {resumeFile ? t("upload.ready") : t("upload.empty")}
              </p>
              <Button
                type="button"
                className="rounded-full px-7"
                disabled={!canGoStep2}
                onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}
              >
                {t("actions.next")} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.step === 2 ? (
        <Card className="mx-auto max-w-4xl overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t("job.title")}</CardTitle>
            <CardDescription>{t("job.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={state.jobDescription}
              onChange={(e) => dispatch({ type: "SET_JOB", payload: e.target.value })}
              rows={12}
              placeholder={t("job.placeholder")}
              className="max-h-72 min-h-72"
            />
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => dispatch({ type: "SET_STEP", payload: 1 })}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> {t("actions.back")}
              </Button>
              <Button
                type="button"
                className="rounded-full px-8"
                onClick={runAnalyze}
                disabled={!canAnalyze || state.status === "running"}
              >
                {t("actions.analyze")} <Sparkles className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.step === 3 ? (
        <div className="space-y-6">
          {state.status === "running" ? (
            <Card className="mx-auto max-w-4xl border-border/80 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{t("job.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background/70 p-3 text-sm text-foreground">
                  {state.jobDescription}
                </div>
                <Progress value={state.progress} />
                <div className="flex justify-center">
                  <Button type="button" className="rounded-full px-8" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("status.analyzing")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {state.status === "error" ? (
            <div className="mx-auto max-w-4xl rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

          {activeResult ? (
            <>
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{t("results.applyingFor")}</p>
                  <h3 className="text-2xl font-semibold text-foreground">{t("job.title")}</h3>
                  <p className={`mt-3 inline-flex rounded-lg border px-3 py-1.5 text-sm font-semibold ${scoreColor}`}>
                    {activeResult.structured.verdict}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{t("results.overallMatch")}</p>
                  <div className="mt-2 flex justify-center">
                    <ScoreRing score={activeResult.structured.overallScore} label={t("results.outOf100")} />
                  </div>
                </div>
              </div>

              <div className="flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
                {(["overview", "breakdown", "actions", "cv"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                      activeTab === tab
                        ? "bg-emerald-500/15 text-emerald-300 outline outline-1 outline-emerald-500/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    type="button"
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {activeTab === "overview" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {sectionItems.map((sec) => (
                      <div key={sec.id} className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                        <div className="mb-3 flex items-start justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{sec.label}</span>
                          <span className="font-mono text-xl font-bold" style={{ color: sec.color }}>
                            {sec.score}
                          </span>
                        </div>
                        <MiniBar score={sec.score} color={sec.color} />
                        <ul className="mt-3 space-y-1">
                          {sec.details.map((detail, idx) => (
                            <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                              <span style={{ color: sec.color }}>◆</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <p className="mb-3 text-xs uppercase tracking-widest text-emerald-300">{t("results.strengths")}</p>
                      {activeResult.structured.strengths.length ? (
                        activeResult.structured.strengths.map((item, idx) => (
                          <div key={idx} className="mb-2 flex items-start gap-2 text-sm text-emerald-200">
                            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-emerald-200/90">{t("results.noStrengths")}</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
                      <p className="mb-3 text-xs uppercase tracking-widest text-rose-300">{t("results.gaps")}</p>
                      {activeResult.structured.gaps.length ? (
                        activeResult.structured.gaps.map((item, idx) => (
                          <div key={idx} className="mb-2 flex items-start gap-2 text-sm text-rose-200">
                            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-rose-200/90">{t("results.noGaps")}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "breakdown" ? (
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">{t("results.fullAnalysis")}</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {activeResult.analysis}
                  </div>
                </div>
              ) : null}

              {activeTab === "cv" ? (
                <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-2">
                          <FilePlus2 className="h-4 w-4 text-emerald-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{t("cv.title")}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t("cv.description")}
                          </p>
                        </div>
                      </div>
                      <Button onClick={generateImprovedCv} disabled={cvLoading} className="w-full rounded-lg">
                        {cvLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("cv.generating")}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t("cv.generate")}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                      <p className="mb-3 text-sm font-semibold text-foreground">{t("cv.template")}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["classic", "modern", "minimal"] as TemplateId[]).map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTemplateId(id)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                              templateId === id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {templateLabel(id, templateLabels)}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={exportImprovedCvPdf}
                        disabled={!cvSections || downloadingCvPdf}
                        className="mt-4 w-full rounded-lg"
                      >
                        {downloadingCvPdf ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {t("cv.exportPdf")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={exportImprovedCvDocx}
                        disabled={!cvSections || downloadingCvDocx}
                        className="mt-2 w-full rounded-lg"
                      >
                        {downloadingCvDocx ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        {t("cv.exportDocx")}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{t("cv.previewTitle")}</h3>
                        <p className="text-xs text-muted-foreground">{t("cv.previewDescription")}</p>
                      </div>
                      {cvSections ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                          {t("cv.ready")}
                        </span>
                      ) : null}
                    </div>
                    {cvSections && CvPreviewComponent ? (
                      <div className="max-h-[720px] overflow-auto rounded-md border border-border bg-muted/30 p-3">
                        <div
                          ref={cvPreviewRef}
                          className="mx-auto bg-white"
                          style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
                        >
                          <CvPreviewComponent data={cvSections} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
                        <div>
                          <FilePlus2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">{t("cv.emptyTitle")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("cv.emptyDescription")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "actions" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card/60 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-lg border border-violet-500/30 bg-violet-500/15 p-2">
                        <Search className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("actionsPanel.jobsTitle")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("actionsPanel.jobsDescription")}
                        </p>
                      </div>
                    </div>
                    <Button onClick={loadJobRecommendations} disabled={jobsLoading} className="w-full rounded-lg">
                      {jobsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("actionsPanel.findingJobs")}
                        </>
                      ) : (
                        t("actionsPanel.findRecommendations")
                      )}
                    </Button>
                    {jobsSearchQuery ? (
                      <p className="mt-3 text-xs text-muted-foreground">{t("actionsPanel.searchQuery", { query: jobsSearchQuery })}</p>
                    ) : null}
                    {jobsWarning ? (
                      <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        {jobsWarning}
                      </p>
                    ) : null}
                  </div>

                  {jobs.length ? (
                    <div className="rounded-xl border border-border bg-card/60 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-violet-400" />
                        <p className="font-semibold">{t("actionsPanel.recommendedJobs")}</p>
                      </div>
                      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                        {jobs.map((job, idx) => (
                          <div key={`${job.link}-${idx}`} className="rounded-lg border border-border bg-background/40 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
                                <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {job.location || t("actionsPanel.locationNotSpecified")}
                                </p>
                              </div>
                              <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-violet-500/40 bg-violet-500/20 p-2 text-violet-300 hover:bg-violet-500/30"
                                aria-label={t("actionsPanel.openJob", { title: job.title })}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            {job.snippet ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {job.snippet}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border bg-card/60 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 p-2">
                        <Target className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("quiz.title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("quiz.description")}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={generateInterviewQuiz}
                      disabled={quizLoading || !state.jobDescription.trim()}
                      className="w-full rounded-lg"
                    >
                      {quizLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("quiz.generating")}
                        </>
                      ) : (
                        t("quiz.generate")
                      )}
                    </Button>
                  </div>

                  {quizQuestions.length ? (
                    <div className="rounded-xl border border-border bg-card/60 p-5">
                      <p className="mb-4 font-semibold text-foreground">{t("quiz.practiceTitle")}</p>
                      <div className="max-h-[520px] space-y-5 overflow-y-auto pr-1">
                        {quizQuestions.map((q, idx) => (
                          <div key={`${q.question}-${idx}`} className="rounded-lg border border-border bg-background/40 p-4">
                            <p className="mb-3 text-sm font-medium text-foreground">
                              {idx + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                              {(["A", "B", "C", "D"] as const).map((option) => {
                                const selected = quizAnswers[idx] === option;
                                const correct = q.correct === option;
                                const showCorrect = quizSubmitted && correct;
                                const showWrong = quizSubmitted && selected && !correct;
                                return (
                                  <label
                                    key={option}
                                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition ${
                                      showCorrect
                                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                        : showWrong
                                          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                                          : selected
                                            ? "border-primary/50 bg-primary/10"
                                            : "border-border bg-background/20 hover:bg-muted/40"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-${idx}`}
                                      checked={selected}
                                      onChange={() =>
                                        !quizSubmitted &&
                                        setQuizAnswers((prev) => ({ ...prev, [idx]: option }))
                                      }
                                      className="mt-0.5"
                                    />
                                    <span>
                                      <span className="mr-1 font-semibold">{option}.</span>
                                      {q.options[option]}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            {quizSubmitted ? (
                              <p className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                {q.explanation}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {!quizSubmitted ? (
                          <Button
                            onClick={() => setQuizSubmitted(true)}
                            className="rounded-lg"
                            disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                          >
                            {t("quiz.submit")}
                          </Button>
                        ) : (
                          <>
                            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                              {t("quiz.score", { score: quizScore, total: quizQuestions.length })}
                            </p>
                            <Button
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => {
                                setQuizSubmitted(false);
                                setQuizAnswers({});
                              }}
                            >
                              {t("quiz.retake")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          <div className="grid gap-2 pt-1 md:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> {t("actions.backToJob")}
            </Button>
            <Button
              type="button"
              className="justify-start rounded-xl"
              onClick={runAnalyze}
              disabled={state.status === "running" || !canAnalyze}
            >
              {t("actions.reanalyze")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-start rounded-xl"
              onClick={() => {
                dispatch({ type: "RESET_ALL" });
                setActiveTab("overview");
                setJobs([]);
                setJobsSearchQuery("");
                setJobsWarning(null);
                setQuizQuestions([]);
                setQuizAnswers({});
                setQuizSubmitted(false);
                setCvSections(null);
                setTemplateId("classic");
                setResumeFile(null);
                if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
                toast.success(t("messages.draftCleared"));
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {t("actions.reset")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

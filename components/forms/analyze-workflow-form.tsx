"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
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
};

type AnalyzeState = {
  step: Step;
  status: Status;
  progress: number;
  resumeFileName: string | null;
  jobDescription: string;
  result: AnalyzeResult | null;
  error: string | null;
  restoredNotice: string | null;
};

type Action =
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_FILE"; payload: string | null }
  | { type: "SET_JOB"; payload: string }
  | { type: "RUN_START" }
  | { type: "RUN_PROGRESS"; payload: number }
  | { type: "RUN_SUCCESS"; payload: AnalyzeResult }
  | { type: "RUN_ERROR"; payload: string }
  | { type: "RESTORE"; payload: AnalyzeState }
  | { type: "CLEAR_NOTICE" }
  | { type: "RESET_ALL" };

const STORAGE_KEY = "cvsmart.analysis.workflow.v1";

const initialState: AnalyzeState = {
  step: 1,
  status: "idle",
  progress: 0,
  resumeFileName: null,
  jobDescription: "",
  result: null,
  error: null,
  restoredNotice: null,
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
      return { ...state, status: "success", progress: 100, result: action.payload, error: null, step: 3 };
    case "RUN_ERROR":
      return { ...state, status: "error", progress: 0, error: action.payload, step: 3 };
    case "RESTORE":
      return action.payload;
    case "CLEAR_NOTICE":
      return { ...state, restoredNotice: null };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

function readPersistedState(): AnalyzeState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AnalyzeState;
    if (parsed.status === "running") {
      return {
        ...parsed,
        status: "error",
        progress: 0,
        error: "Analysis was interrupted by reload. Click Analyze again to resume.",
        restoredNotice: "Recovered your draft after page reload.",
      };
    }
    return { ...parsed, restoredNotice: "Recovered your draft after page reload." };
  } catch {
    return null;
  }
}

function scoreTone(score: number): "good" | "mid" | "low" {
  if (score >= 75) return "good";
  if (score >= 50) return "mid";
  return "low";
}

function ScoreRing({ score }: { score: number }) {
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
        <p className="text-[10px] text-muted-foreground">out of 100</p>
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "actions">("overview");
  const [resumeFile, setResumeFile] = useReducer(
    (_: File | null, next: File | null) => next,
    null
  );

  useEffect(() => {
    const restored = readPersistedState();
    if (restored) {
      dispatch({ type: "RESTORE", payload: restored });
      toast.info("Recovered your previous analysis draft.");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const canGoStep2 = Boolean(resumeFile);
  const canAnalyze = canGoStep2 && state.jobDescription.trim().length >= 20;

  const scoreColor = useMemo(() => {
    const score = state.result?.structured.overallScore ?? 0;
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-300";
    return "text-rose-400";
  }, [state.result?.structured.overallScore]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const allowed = [".pdf", ".docx", ".txt"];
    if (!allowed.some((ext) => fileName.endsWith(ext))) {
      toast.error("Upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max size is 10MB.");
      return;
    }
    setResumeFile(file);
    dispatch({ type: "SET_FILE", payload: file.name });
    toast.success("Resume file selected.");
  };

  const runAnalyze = async () => {
    if (!canAnalyze) {
      toast.error("Please provide both resume text and job description (20+ chars each).");
      return;
    }
    if (!resumeFile) {
      toast.error("Resume file is required.");
      return;
    }

    dispatch({ type: "RUN_START" });

    let progress = 5;
    const timer = window.setInterval(() => {
      progress += 5;
      dispatch({ type: "RUN_PROGRESS", payload: progress });
    }, 250);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", state.jobDescription.trim());
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      let payload: { data?: AnalyzeResult; error?: { message?: string } } | null = null;
      const responseType = response.headers.get("content-type") || "";
      if (responseType.includes("application/json")) {
        payload = (await response.json()) as { data?: AnalyzeResult; error?: { message?: string } };
      } else {
        const nonJsonBody = await response.text();
        throw new Error(
          nonJsonBody.includes("<!DOCTYPE")
            ? "Server returned an unexpected HTML response. Please refresh and try again."
            : "Server returned an unexpected response format."
        );
      }

      if (!response.ok || payload.error || !payload.data) {
        throw new Error(payload.error?.message || "Analysis failed.");
      }
      const data = payload.data;
      dispatch({ type: "RUN_SUCCESS", payload: data });
      setActiveTab("overview");
      toast.success("Analysis complete.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed.";
      dispatch({ type: "RUN_ERROR", payload: message });
      toast.error(message);
    } finally {
      window.clearInterval(timer);
    }
  };

  const stepMeta: Array<{ id: Step; label: string }> = [
    { id: 1, label: "Upload CV" },
    { id: 2, label: "Job description" },
    { id: 3, label: "View results" },
  ];
  const completedThrough =
    state.step === 3 ? (state.status === "success" ? 3 : 2) : state.step === 2 ? 1 : 0;
  const sectionItems = useMemo(() => {
    const result = state.result?.structured;
    if (!result) return [];
    const overall = Math.max(0, Math.min(100, result.overallScore));
    return [
      {
        id: "technical",
        label: "Technical Alignment",
        score: overall,
        color: "#00e5a0",
        details: result.strengths.slice(0, 3).length ? result.strengths.slice(0, 3) : ["Strong technical overlap"],
      },
      {
        id: "experience",
        label: "Experience Match",
        score: Math.max(0, Math.min(100, overall - 6)),
        color: "#ff4d6d",
        details: ["Experience level compared to role requirements"],
      },
      {
        id: "projects",
        label: "Project Relevance",
        score: Math.max(0, Math.min(100, overall - 3)),
        color: "#00b4d8",
        details: ["Project examples aligned with the job scope"],
      },
      {
        id: "communication",
        label: "Communication & Fit",
        score: Math.max(0, Math.min(100, overall - 8)),
        color: "#f5a524",
        details: result.gaps.slice(0, 2).length ? result.gaps.slice(0, 2) : ["Professional communication fit"],
      },
    ];
  }, [state.result]);

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
            dismiss
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
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>Click to upload or drag and drop your CV file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center transition hover:bg-muted/40">
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={onFileChange} />
              <span className="mb-3 rounded-full border border-border bg-background/80 p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {state.resumeFileName ? state.resumeFileName : "Click to upload resume"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX (max. 10MB)</p>
            </label>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {state.resumeFileName ? "File ready for analysis" : "No file selected"}
              </p>
              <Button
                type="button"
                className="rounded-full px-7"
                disabled={!canGoStep2}
                onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.step === 2 ? (
        <Card className="mx-auto max-w-4xl overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>Paste the target job description. Minimum 20 characters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={state.jobDescription}
              onChange={(e) => dispatch({ type: "SET_JOB", payload: e.target.value })}
              rows={12}
              placeholder="Paste the job description here..."
              className="max-h-72 min-h-72"
            />
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => dispatch({ type: "SET_STEP", payload: 1 })}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                className="rounded-full px-8"
                onClick={runAnalyze}
                disabled={!canAnalyze || state.status === "running"}
              >
                Analyze <Sparkles className="ml-1 h-4 w-4" />
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
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background/70 p-3 text-sm text-foreground">
                  {state.jobDescription}
                </div>
                <Progress value={state.progress} />
                <div className="flex justify-center">
                  <Button type="button" className="rounded-full px-8" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing
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

          {state.result ? (
            <>
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Applying for</p>
                  <h3 className="text-2xl font-semibold text-foreground">Job Description</h3>
                  <p className={`mt-3 inline-flex rounded-lg border px-3 py-1.5 text-sm font-semibold ${scoreColor}`}>
                    {state.result.structured.verdict}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Overall Match</p>
                  <div className="mt-2 flex justify-center">
                    <ScoreRing score={state.result.structured.overallScore} />
                  </div>
                </div>
              </div>

              <div className="flex w-fit gap-1 rounded-xl border border-border bg-muted/30 p-1">
                {(["overview", "breakdown", "actions"] as const).map((tab) => (
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
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                      <p className="mb-3 text-xs uppercase tracking-widest text-emerald-300">Strengths</p>
                      {state.result.structured.strengths.length ? (
                        state.result.structured.strengths.map((item, idx) => (
                          <div key={idx} className="mb-2 flex items-start gap-2 text-sm text-emerald-200">
                            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-emerald-200/90">No strengths provided.</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
                      <p className="mb-3 text-xs uppercase tracking-widest text-rose-300">Gaps</p>
                      {state.result.structured.gaps.length ? (
                        state.result.structured.gaps.map((item, idx) => (
                          <div key={idx} className="mb-2 flex items-start gap-2 text-sm text-rose-200">
                            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-rose-200/90">No gaps provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "breakdown" ? (
                <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Full Analysis</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {state.result.analysis}
                  </div>
                </div>
              ) : null}

              {activeTab === "actions" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card/60 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-lg border border-violet-500/30 bg-violet-500/15 p-2">
                        <Search className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold">Get job recommendations</p>
                        <p className="text-xs text-muted-foreground">We will add this in the next step.</p>
                      </div>
                    </div>
                    <Button disabled className="w-full rounded-lg">
                      Coming next
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 p-2">
                        <Target className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold">Interview prep quiz</p>
                        <p className="text-xs text-muted-foreground">We will add this right after jobs.</p>
                      </div>
                    </div>
                    <Button disabled className="w-full rounded-lg">
                      Coming next
                    </Button>
                  </div>
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
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Job Description
            </Button>
            <Button
              type="button"
              className="justify-start rounded-xl"
              onClick={runAnalyze}
              disabled={state.status === "running" || !canAnalyze}
            >
              Re-analyze
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-start rounded-xl"
              onClick={() => {
                dispatch({ type: "RESET_ALL" });
                setActiveTab("overview");
                setResumeFile(null);
                if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
                toast.success("Analysis draft cleared.");
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

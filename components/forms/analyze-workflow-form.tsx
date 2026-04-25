"use client";

import { useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { postJson } from "@/lib/fetchers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function AnalyzeWorkflowForm() {
  const [state, dispatch] = useReducer(reducer, initialState);
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
      const payload = (await response.json()) as { data?: AnalyzeResult; error?: { message?: string } };
      if (!response.ok || payload.error || !payload.data) {
        throw new Error(payload.error?.message || "Analysis failed.");
      }
      const data = payload.data;
      dispatch({ type: "RUN_SUCCESS", payload: data });
      toast.success("Analysis complete.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed.";
      dispatch({ type: "RUN_ERROR", payload: message });
      toast.error(message);
    } finally {
      window.clearInterval(timer);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 1 as Step, label: "Resume" },
          { id: 2 as Step, label: "Job" },
          { id: 3 as Step, label: "Results" },
        ].map((item) => {
          const active = state.step === item.id;
          const done = state.step > item.id || (item.id === 3 && state.status === "success");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => dispatch({ type: "SET_STEP", payload: item.id })}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-border bg-card/70 text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {state.step === 1 ? (
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Step 1: Resume File</CardTitle>
            <CardDescription>Upload your resume file in PDF, DOCX, or TXT format (max 10MB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center transition hover:bg-muted/40">
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={onFileChange} />
              <p className="text-sm font-medium text-foreground">
                {state.resumeFileName ? state.resumeFileName : "Click to upload resume"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT</p>
            </label>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {state.resumeFileName ? "File ready for analysis" : "No file selected"}
              </p>
              <Button type="button" disabled={!canGoStep2} onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.step === 2 ? (
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Step 2: Job Description</CardTitle>
            <CardDescription>Paste the target job description. Minimum 20 characters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={state.jobDescription}
              onChange={(e) => dispatch({ type: "SET_JOB", payload: e.target.value })}
              rows={10}
              placeholder="Paste the job description here..."
            />
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: "SET_STEP", payload: 1 })}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={runAnalyze} disabled={!canAnalyze || state.status === "running"}>
                Analyze <Sparkles className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.step === 3 ? (
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Step 3: Analysis Results</CardTitle>
            <CardDescription>Results remain in draft if you reload mid-process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.status === "running" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your resume...
                </div>
                <Progress value={state.progress} />
              </div>
            ) : null}

            {state.status === "error" ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            ) : null}

            {state.result ? (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="gaps">Gaps</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="space-y-2">
                  <p className="text-sm text-muted-foreground">Overall score</p>
                  <p className={`text-4xl font-bold ${scoreColor}`}>{state.result.structured.overallScore}%</p>
                  <p className="text-sm text-muted-foreground">Verdict: {state.result.structured.verdict}</p>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {state.result.analysis}
                  </div>
                </TabsContent>
                <TabsContent value="strengths" className="space-y-2">
                  {state.result.structured.strengths.length ? (
                    state.result.structured.strengths.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No strengths provided.</p>
                  )}
                </TabsContent>
                <TabsContent value="gaps" className="space-y-2">
                  {state.result.structured.gaps.length ? (
                    state.result.structured.gaps.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No gaps provided.</p>
                  )}
                </TabsContent>
              </Tabs>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Job Description
              </Button>
              <Button type="button" onClick={runAnalyze} disabled={state.status === "running" || !canAnalyze}>
                Re-analyze
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  dispatch({ type: "RESET_ALL" });
                  setResumeFile(null);
                  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
                  toast.success("Analysis draft cleared.");
                }}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

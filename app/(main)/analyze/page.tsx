import { AnalyzeWorkflowForm } from "@/components/forms/analyze-workflow-form";

export default function AnalyzePage() {
  return (
    <main className="analyze-page min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-5xl p-6 md:p-8">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Resume <span className="text-display font-serif italic">Analyzer</span>
        </h1>
        <p className="mb-8 text-muted-foreground">
          Professional multi-step workflow with reload-safe draft recovery and robust API error handling.
        </p>
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <AnalyzeWorkflowForm />
        </div>
      </div>
    </main>
  );
}

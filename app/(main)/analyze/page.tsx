import { AnalyzeDemoForm } from "@/components/forms/analyze-demo-form";

export default function AnalyzePage() {
  return (
    <main className="analyze-page min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-4xl p-6 md:p-8">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Resume <span className="text-display font-serif italic">Analyzer</span>
        </h1>
        <p className="mb-8 text-muted-foreground">Upload your resume and a job description to get actionable AI feedback.</p>
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <AnalyzeDemoForm />
        </div>
      </div>
    </main>
  );
}

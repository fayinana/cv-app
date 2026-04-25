import { Sparkles } from "lucide-react";
import { CvBuilderForm } from "@/components/forms/cv-builder-form";

export default function BuildPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute right-0 top-0 h-1/3 w-1/3 rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute bottom-0 left-0 h-1/3 w-1/3 rounded-full bg-emerald-500/20 blur-[150px]" />
      </div>
      <header className="relative z-10 border-b border-border/80 px-4 py-12 backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            Build <span className="font-serif italic">CV</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Create a modern, ATS-friendly CV with AI-assisted drafting, structured editing, and live preview.
          </p>
        </div>
      </header>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-sm md:p-6">
          <CvBuilderForm />
        </div>
      </div>
    </main>
  );
}

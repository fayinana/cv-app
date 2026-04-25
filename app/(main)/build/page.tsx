import { CvTemplateDemoForm } from "@/components/forms/cv-template-demo-form";

export default function BuildPage() {
  return (
    <main className="app-page min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-4xl p-6 md:p-8">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Build <span className="text-display font-serif italic">CV</span>
        </h1>
        <p className="mb-8 text-muted-foreground">Generate CV sections and iterate on your content quickly.</p>
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <CvTemplateDemoForm />
        </div>
      </div>
    </main>
  );
}

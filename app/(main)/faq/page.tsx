"use client";

export default function FaqPage() {
  return (
    <div className="app-page min-h-screen bg-background text-foreground overflow-hidden">
      <main className="relative z-10 container mx-auto max-w-4xl p-6 md:p-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-8">
          Frequently Asked <span className="text-display font-serif italic">Questions</span>
        </h1>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-medium text-foreground">What is the Resume Analyzer?</h3>
            <p className="text-muted-foreground mt-2">AI-powered resume analysis against a job description, with actionable feedback and suggestions.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-medium text-foreground">Is my personal data safe?</h3>
            <p className="text-muted-foreground mt-2">We process uploads securely and do not sell personal data.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

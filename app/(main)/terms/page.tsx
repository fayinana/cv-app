export default function TermsPage() {
  return (
    <div className="app-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="relative z-10 container mx-auto max-w-4xl p-6 md:p-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Terms of <span className="text-display font-serif italic">Service</span></h1>
        <section className="mt-8 space-y-6 text-muted-foreground">
          <p>By using CVSmart, you agree to these terms and applicable laws.</p>
          <p>CVSmart provides AI-assisted resume analysis and CV building tools on an “as is” basis.</p>
          <p>For terms questions, contact support@cvsmart.com.</p>
        </section>
      </main>
    </div>
  );
}

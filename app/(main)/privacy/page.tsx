export default function PrivacyPage() {
  return (
    <div className="app-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="relative z-10 container mx-auto max-w-4xl p-6 md:p-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Privacy <span className="text-display font-serif italic">Policy</span></h1>
        <section className="mt-8 space-y-6 text-muted-foreground">
          <p>We collect account information and profile data you provide to deliver CVSmart features.</p>
          <p>Resume and job description content is processed to produce requested analysis and suggestions.</p>
          <p>For questions, contact support@cvsmart.com.</p>
        </section>
      </main>
    </div>
  );
}

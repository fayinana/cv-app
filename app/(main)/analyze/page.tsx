import { AnalyzeDemoForm } from "@/components/forms/analyze-demo-form";

export default function AnalyzePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Analyze Resume</h1>
      <p className="mb-6 text-gray-600">
        Contract-backed page using fetch and no lifecycle data fetching.
      </p>
      <AnalyzeDemoForm />
    </main>
  );
}

import { CvTemplateDemoForm } from "@/components/forms/cv-template-demo-form";

export default function BuildPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Build CV</h1>
      <p className="mb-6 text-gray-600">
        Uses fetch contracts and server-backed placeholders for now.
      </p>
      <CvTemplateDemoForm />
    </main>
  );
}

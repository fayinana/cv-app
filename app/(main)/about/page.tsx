import { StaticPage } from "@/components/layout/static-page";

export default function AboutPage() {
  return (
    <StaticPage
      title="About CVSmart"
      subtitle="AI-assisted resume workflows with a cleaner Next.js architecture."
    >
      <p>
        CVSmart helps candidates analyze resumes, prepare for interviews, and
        generate improved CV drafts.
      </p>
      <p>
        This migration keeps the same user-facing design while upgrading backend
        architecture for maintainability.
      </p>
    </StaticPage>
  );
}

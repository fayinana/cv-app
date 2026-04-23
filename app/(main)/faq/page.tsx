import { StaticPage } from "@/components/layout/static-page";

export default function FaqPage() {
  return (
    <StaticPage title="FAQ" subtitle="Common questions about CVSmart.">
      <p>
        <strong>How is my data used?</strong> Resume content is processed to
        produce analysis and recommendations.
      </p>
      <p>
        <strong>Can I edit generated CV drafts?</strong> Yes, editability is a
        core feature.
      </p>
    </StaticPage>
  );
}

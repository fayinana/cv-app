"use client";

import { useState } from "react";
import { postJson } from "@/lib/fetchers";

type CvTemplateResponse = {
  data?: {
    sections: Record<string, unknown>;
  };
  error?: { message: string };
};

export function CvTemplateDemoForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [output, setOutput] = useState<CvTemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setOutput(null);

    try {
      const data = await postJson<CvTemplateResponse["data"], {
        jobDescription: string;
        analysis: string;
      }>("/api/cv/templates", { jobDescription, analysis });
      setOutput({ data });
    } catch (error) {
      setOutput({ error: { message: (error as Error).message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border p-4">
      <textarea
        className="w-full rounded border px-3 py-2"
        rows={5}
        placeholder="Job description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
      <textarea
        className="w-full rounded border px-3 py-2"
        rows={4}
        placeholder="Optional analysis text"
        value={analysis}
        onChange={(e) => setAnalysis(e.target.value)}
      />
      <button className="rounded bg-black px-4 py-2 text-white" disabled={loading}>
        {loading ? "Generating..." : "Generate draft"}
      </button>
      {output ? (
        <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">
          {JSON.stringify(output, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}

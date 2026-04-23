import type { ReactNode } from "react";

type StaticPageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function StaticPage({ title, subtitle, children }: StaticPageProps) {
  return (
    <main className="app-page min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8">
        <h1 className="text-4xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-2 text-gray-600">{subtitle}</p> : null}
        <div className="mt-8 space-y-4 text-gray-700">{children}</div>
      </div>
    </main>
  );
}

"use client";

import { useTranslations } from "next-intl";

export default function MainLoading() {
  const t = useTranslations("loading");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute right-0 top-0 h-1/3 w-1/3 rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute bottom-0 left-0 h-1/3 w-1/3 rounded-full bg-emerald-500/20 blur-[150px]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border/80 bg-card/70 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-primary/30" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("mainTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("mainSubtitle")}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-xl bg-muted/70" />
            <div className="h-24 animate-pulse rounded-xl bg-muted/70" />
            <div className="h-24 animate-pulse rounded-xl bg-muted/70" />
          </div>
        </div>
      </div>
    </main>
  );
}

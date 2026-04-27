"use client";

import { useTranslations } from "next-intl";

export default function AuthLoading() {
  const t = useTranslations("loading");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="mx-auto mb-6 h-12 w-12 animate-pulse rounded-xl bg-primary/30" />
        <div className="text-center">
          <p className="text-base font-semibold">{t("authTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("authSubtitle")}</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 animate-pulse rounded-lg bg-primary/30" />
        </div>
      </div>
    </main>
  );
}

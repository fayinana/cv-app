"use client";

import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, LogOut, LayoutDashboard, User, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

export function MainNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setIsSignedIn(!!session);
        setUserEmail(session?.user?.email ?? null);
        setAvatarUrl((session?.user?.user_metadata?.avatar_url as string) ?? null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setUserEmail(null);
    setAvatarUrl(null);
    setMobileOpen(false);
    router.refresh();
  };

  const navLinkClass = "text-muted-foreground hover:text-foreground transition-colors";
  const mobileNavLinkClass = `${navLinkClass} block py-3 text-base border-b border-border`;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-md bg-background/95">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground truncate">{t("brand")}</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 shrink-0">
            <Link href="/#features" className={navLinkClass}>{t("features")}</Link>
            <Link href="/#how-it-works" className={navLinkClass}>{t("howItWorks")}</Link>
            <Link href="/build" className={navLinkClass}>{t("buildCv")}</Link>
            <Link href="/analyze" className={navLinkClass}>{t("analyze")}</Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="flex items-center space-x-4 ml-4 justify-end">
              {isLoading ? (
                <div className="rounded-full h-10 w-10 p-0 ring-1 ring-border flex items-center justify-center" aria-hidden>
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                </div>
              ) : isSignedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 p-0 ring-1 ring-border">
                      <Avatar className="h-9 w-9 rounded-full border-2 border-transparent">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                        <AvatarFallback className="bg-accent text-accent-foreground rounded-full text-sm font-medium"><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl border border-border bg-card/95 p-2">
                    {userEmail ? <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground truncate">{userEmail}</div> : null}
                    <DropdownMenuSeparator className="bg-border my-1" />
                    <DropdownMenuItem onSelect={() => router.push("/dashboard")} className="rounded-lg py-2.5 cursor-pointer"><LayoutDashboard className="h-4 w-4 shrink-0 mr-2" /> {t("dashboard")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push("/profile")} className="rounded-lg py-2.5 cursor-pointer"><User className="h-4 w-4 shrink-0 mr-2" /> {t("profile")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push("/setting")} className="rounded-lg py-2.5 cursor-pointer"><Settings className="h-4 w-4 shrink-0 mr-2" /> {t("settings")}</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border my-1" />
                    <DropdownMenuItem onSelect={handleLogout} className="rounded-lg py-2.5 cursor-pointer text-destructive"><LogOut className="h-4 w-4 shrink-0 mr-2" /> {t("logout")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login" className={navLinkClass}>{t("signIn")}</Link>
                  <Button size="sm" className="rounded-full px-4" asChild><Link href="/signup">{t("signUp")}</Link></Button>
                </>
              )}
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <ThemeToggle />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>
      {mobileOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-[60] bg-black/50" aria-hidden="true" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 z-[70] h-full w-[min(85%,20rem)] border-l border-border bg-background shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center"><Sparkles className="w-4 h-4 text-primary-foreground" /></div>
                <span className="text-lg font-bold tracking-tight text-foreground">{t("brand")}</span>
              </Link>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex flex-col px-4 pt-2">
              <Link href="/#features" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t("features")}</Link>
              <Link href="/#how-it-works" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t("howItWorks")}</Link>
              <Link href="/build" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t("buildCv")}</Link>
              <Link href="/analyze" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t("analyze")}</Link>
            </div>
            <div className="mx-4 mt-4 flex items-center justify-between gap-2 py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Language</span>
              <LanguageSwitcher />
            </div>
            <div className="mt-auto px-4 pb-6 pt-4 flex flex-col gap-3">
              {isLoading ? <Skeleton className="h-10 w-full rounded-xl" /> : isSignedIn ? (
                <Button variant="destructive" className="w-full rounded-xl" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />{t("logout")}</Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full rounded-xl" asChild><Link href="/login" onClick={() => setMobileOpen(false)}>{t("signIn")}</Link></Button>
                  <Button className="w-full rounded-xl" asChild><Link href="/signup" onClick={() => setMobileOpen(false)}>{t("signUp")}</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

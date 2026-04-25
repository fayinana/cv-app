import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getOrCreateCurrentUserProfile } from "@/lib/server/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, UserRound, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-3 text-gray-600">
          Configure Supabase env variables to enable authenticated dashboard
          behavior.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileState = await getOrCreateCurrentUserProfile();
  const profile = profileState.ok ? profileState.profile : null;
  const profileCompletenessParts = [
    profile?.full_name,
    profile?.title,
    profile?.location,
    profile?.bio,
    profile?.phone,
    profile?.linkedin,
    profile?.github,
  ];
  const completedFields = profileCompletenessParts.filter((item) => Boolean(item && item.trim().length > 0)).length;
  const profileCompleteness = Math.round((completedFields / profileCompletenessParts.length) * 100);

  return (
    <main className="app-page min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-5xl p-6 md:p-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Professional <span className="text-display font-serif italic">Dashboard</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Welcome back, {profile?.full_name || user.email || "there"}. Start from quick actions and keep your profile ready.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Profile completeness</CardDescription>
              <CardTitle className="text-3xl">{profileCompleteness}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={profileCompleteness} />
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Resume analyses</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Overview phase</Badge>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Saved CV drafts</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Overview phase</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-4 w-4 text-primary" />
                Analyze Resume
              </CardTitle>
              <CardDescription>Get AI-powered strengths, gaps, and recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full rounded-full">
                <Link href="/analyze">Open analysis</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4 text-primary" />
                Build CV
              </CardTitle>
              <CardDescription>Create and iterate CV sections from your analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/build">Open CV builder</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-4 w-4 text-primary" />
                Complete Profile
              </CardTitle>
              <CardDescription>Improve profile quality for exports and recruiter visibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recent activity
            </CardTitle>
            <CardDescription>Activity feed is coming next. This placeholder keeps the layout production-ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No recent analysis yet. Start your first resume analysis.</p>
            <p>No CV draft generated yet. Build one after your analysis.</p>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Dashboard is intentionally overview-focused in this phase; deeper analytics modules come in the next iteration.
        </p>
      </div>
    </main>
  );
}

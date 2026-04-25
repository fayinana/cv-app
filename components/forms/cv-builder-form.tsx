"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";
import { postJson } from "@/lib/fetchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportElementToPdf } from "@/lib/pdf-export";
import { TEMPLATE_MAP, type TemplateId, type CVData } from "@/components/cv-templates";
import type { Profile } from "@/lib/types";
type CvSections = CVData;

type GenerateResponse = { sections: CvSections };

const EMPTY_SECTIONS: CvSections = {
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
};
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export function CvBuilderForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [sections, setSections] = useState<CvSections>(EMPTY_SECTIONS);
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generated, setGenerated] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const skillsText = useMemo(() => sections.skills.join(", "), [sections.skills]);
  const PreviewComponent = TEMPLATE_MAP[templateId];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const payload = (await response.json()) as {
          data?: Profile;
          error?: { message?: string };
        };
        if (!response.ok || payload.error || !payload.data) {
          setProfileLoading(false);
          return;
        }
        const profile = payload.data;
        setSections((prev) => ({
          ...prev,
          personal: {
            ...prev.personal,
            fullName: profile.full_name || prev.personal.fullName,
            title: profile.title || prev.personal.title,
            email: profile.email || prev.personal.email,
            phone: profile.phone || prev.personal.phone,
            location: profile.location || prev.personal.location,
            website: profile.website || prev.personal.website,
            linkedin: profile.linkedin || prev.personal.linkedin,
            github: profile.github || prev.personal.github,
          },
          summary: profile.bio || prev.summary,
          skills: profile.skills?.length ? profile.skills : prev.skills,
          experience:
            profile.experience?.length
              ? profile.experience.map((item) => ({
                  role: item.position || "",
                  company: item.company || "",
                  dates: item.duration || "",
                  bullets: item.description
                    ? item.description
                        .split("\n")
                        .map((b) => b.trim())
                        .filter(Boolean)
                    : [],
                }))
              : prev.experience,
          education:
            profile.education?.length
              ? profile.education.map((item) => ({
                  degree: item.degree || "",
                  school: item.institution || "",
                  year: item.year || "",
                }))
              : prev.education,
        }));
      } catch {
        // non-blocking
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const generateDraft = async () => {
    if (jobDescription.trim().length < 20) {
      toast.error("Add a job description with at least 20 characters.");
      return;
    }
    setLoading(true);
    try {
      const payload = await postJson<GenerateResponse, { jobDescription: string; analysis?: string }>(
        "/api/cv/templates",
        {
          jobDescription: jobDescription.trim(),
          analysis: analysisNotes.trim() || undefined,
        }
      );
      setSections(payload.sections);
      setGenerated(true);
      toast.success("CV draft generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate CV draft.");
    } finally {
      setLoading(false);
    }
  };

  const exportAsText = () => {
    const lines: string[] = [];
    const p = sections.personal;
    lines.push(p.fullName);
    lines.push(p.title);
    lines.push([p.email, p.phone, p.location, p.website].filter(Boolean).join(" | "));
    lines.push("");
    lines.push("SUMMARY");
    lines.push(sections.summary);
    lines.push("");
    lines.push("SKILLS");
    lines.push(sections.skills.join(", "));
    lines.push("");
    lines.push("EXPERIENCE");
    for (const exp of sections.experience) {
      lines.push(`${exp.role} - ${exp.company} (${exp.dates})`);
      exp.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }
    lines.push("EDUCATION");
    for (const edu of sections.education) {
      lines.push(`${edu.degree} - ${edu.school} (${edu.year})`);
    }
    lines.push("");
    lines.push("PROJECTS");
    for (const proj of sections.projects) {
      lines.push(`${proj.title}: ${proj.description}`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv_draft.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CV exported as text.");
  };

  const exportAsPdf = async () => {
    if (!previewRef.current) {
      toast.error("Preview is not ready.");
      return;
    }
    setDownloadingPdf(true);
    try {
      await exportElementToPdf({
        element: previewRef.current,
        filename: "cv_template_export.pdf",
      });
      toast.success("PDF export started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">CV Draft Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                placeholder="Paste the role you are targeting..."
              />
            </div>
            <div className="space-y-2">
              <Label>Optional Analysis Notes</Label>
              <Textarea
                value={analysisNotes}
                onChange={(e) => setAnalysisNotes(e.target.value)}
                rows={5}
                placeholder="Add strengths/gaps or specific focus points..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={generateDraft} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                Generate Draft
              </Button>
              <Button variant="outline" onClick={exportAsPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportAsText} disabled={!generated}>
                <Download className="mr-2 h-4 w-4" />
                Export TXT
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Structured Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-3">
                <Input placeholder="Full name" value={sections.personal.fullName} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, fullName: e.target.value } }))} />
                <Input placeholder="Professional title" value={sections.personal.title} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, title: e.target.value } }))} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Email" value={sections.personal.email} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, email: e.target.value } }))} />
                  <Input placeholder="Phone" value={sections.personal.phone} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, phone: e.target.value } }))} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Location" value={sections.personal.location} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, location: e.target.value } }))} />
                  <Input placeholder="Website" value={sections.personal.website} onChange={(e) => setSections((s) => ({ ...s, personal: { ...s.personal, website: e.target.value } }))} />
                </div>
                <Input
                  placeholder="Skills (comma-separated)"
                  value={skillsText}
                  onChange={(e) =>
                    setSections((s) => ({
                      ...s,
                      skills: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </TabsContent>

              <TabsContent value="summary">
                <Textarea
                  rows={8}
                  value={sections.summary}
                  onChange={(e) => setSections((s) => ({ ...s, summary: e.target.value }))}
                  placeholder="Write a concise professional summary..."
                />
              </TabsContent>

              <TabsContent value="experience" className="space-y-3">
                {sections.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input value={exp.role} placeholder="Role" onChange={(e) => setSections((s) => ({ ...s, experience: s.experience.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)) }))} />
                      <Input value={exp.company} placeholder="Company" onChange={(e) => setSections((s) => ({ ...s, experience: s.experience.map((x, i) => (i === idx ? { ...x, company: e.target.value } : x)) }))} />
                    </div>
                    <Input value={exp.dates} placeholder="Dates" onChange={(e) => setSections((s) => ({ ...s, experience: s.experience.map((x, i) => (i === idx ? { ...x, dates: e.target.value } : x)) }))} />
                    <Textarea
                      rows={4}
                      value={exp.bullets.join("\n")}
                      placeholder="One bullet per line"
                      onChange={(e) => setSections((s) => ({ ...s, experience: s.experience.map((x, i) => (i === idx ? { ...x, bullets: e.target.value.split("\n").map((b) => b.trim()).filter(Boolean) } : x)) }))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setSections((s) => ({ ...s, experience: s.experience.filter((_, i) => i !== idx) }))}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => setSections((s) => ({ ...s, experience: [...s.experience, { role: "", company: "", dates: "", bullets: [] }] }))}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Experience
                </Button>
              </TabsContent>

              <TabsContent value="education" className="space-y-3">
                {sections.education.map((edu, idx) => (
                  <div key={idx} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-3">
                    <Input value={edu.degree} placeholder="Degree" onChange={(e) => setSections((s) => ({ ...s, education: s.education.map((x, i) => (i === idx ? { ...x, degree: e.target.value } : x)) }))} />
                    <Input value={edu.school} placeholder="School" onChange={(e) => setSections((s) => ({ ...s, education: s.education.map((x, i) => (i === idx ? { ...x, school: e.target.value } : x)) }))} />
                    <Input value={edu.year} placeholder="Year" onChange={(e) => setSections((s) => ({ ...s, education: s.education.map((x, i) => (i === idx ? { ...x, year: e.target.value } : x)) }))} />
                  </div>
                ))}
                <Button variant="outline" onClick={() => setSections((s) => ({ ...s, education: [...s.education, { degree: "", school: "", year: "" }] }))}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Education
                </Button>
              </TabsContent>

              <TabsContent value="projects" className="space-y-3">
                {sections.projects.map((project, idx) => (
                  <div key={idx} className="space-y-2 rounded-lg border border-border p-3">
                    <Input value={project.title} placeholder="Project title" onChange={(e) => setSections((s) => ({ ...s, projects: s.projects.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)) }))} />
                    <Textarea
                      rows={3}
                      value={project.description}
                      placeholder="Project description"
                      onChange={(e) => setSections((s) => ({ ...s, projects: s.projects.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)) }))}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={() => setSections((s) => ({ ...s, projects: [...s.projects, { title: "", description: "" }] }))}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Project
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit border-border/80 bg-card/80 backdrop-blur-sm lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="text-xl">Live CV Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {(["classic", "modern", "minimal"] as TemplateId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplateId(id)}
                className={`rounded-md border px-2 py-1 text-xs ${templateId === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {id}
              </button>
            ))}
          </div>
          {profileLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching profile data...
            </div>
          ) : null}
          <div className="overflow-auto rounded-md border border-border bg-muted/30 p-3">
            <div
              ref={previewRef}
              className="mx-auto bg-white"
              style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
            >
              <PreviewComponent data={sections} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

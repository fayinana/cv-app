import { generateJsonWithGemini } from "@/lib/ai/gemini";

type CvSections = {
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    dates: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
  }>;
};

export async function generateCvSections(params: {
  jobDescription: string;
  analysis?: string;
}) {
  const fallback: { sections: CvSections } = {
    sections: {
      personal: {
        fullName: "Candidate Name",
        title: "Software Engineer",
        email: "candidate@example.com",
        phone: "+251-900-000000",
        location: "Addis Ababa",
        website: "",
      },
      summary:
        "Results-driven engineer with a focus on delivering production-ready solutions and measurable outcomes.",
      skills: ["TypeScript", "React", "Node.js", "Testing"],
      experience: [],
      education: [],
      projects: [],
    },
  };

  const prompt = `
Create structured CV sections aligned to this job:
${params.jobDescription}

Optional analysis context:
${params.analysis ?? ""}

Return strict JSON:
{
  "sections": {
    "personal": {
      "fullName": string,
      "title": string,
      "email": string,
      "phone": string,
      "location": string,
      "website": string,
      "linkedin": string,
      "github": string
    },
    "summary": string,
    "skills": string[],
    "experience": [{"role": string, "company": string, "dates": string, "bullets": string[]}],
    "education": [{"degree": string, "school": string, "year": string}],
    "projects": [{"title": string, "description": string}]
  }
}
`;

  return generateJsonWithGemini(prompt, fallback);
}

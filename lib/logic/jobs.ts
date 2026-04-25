import { env } from "@/lib/env";
import { generateJsonWithGemini } from "@/lib/ai/gemini";

type JobItem = {
  title: string;
  company: string;
  location: string;
  link: string;
  snippet: string;
  source?: string;
};

type JobsResult = {
  searchQuery: string;
  jobs: JobItem[];
  warning?: string;
  location?: string;
};

function fallbackJobs(query: string, location?: string, warning?: string): JobsResult {
  return {
    searchQuery: query,
    warning:
      warning ??
      "SerpAPI key is missing or request failed. Returning fallback recommendations.",
    location,
    jobs: [
      {
        title: `${query} Engineer`,
        company: "Sample Company",
        location: location || "Remote",
        link: "https://www.linkedin.com/jobs/",
        snippet: "Fallback recommendation while jobs provider is unavailable.",
        source: "fallback",
      },
    ],
  };
}

function cleanRole(value: string): string {
  return value
    .replace(/[|,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of values) {
    const clean = item.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

function heuristicKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2 && w.length < 20);
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "your",
    "you",
    "that",
    "this",
    "are",
    "job",
    "resume",
    "experience",
    "skills",
  ]);
  const counts = new Map<string, number>();
  for (const w of words) {
    if (stop.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}

function sanitizeJobTitleCandidate(title: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (/\d/.test(t)) return "";
  if (/[|,]/.test(t)) return "";
  if (t.length < 3 || t.length > 45) return "";
  const lower = t.toLowerCase();
  if (t.includes("@") || lower.includes("http") || lower.includes("www.")) return "";
  if (
    ["curriculum", "resume", "cv", "objective", "summary", "education"].some((k) =>
      lower.includes(k)
    )
  ) {
    return "";
  }
  if (!/^[A-Za-z][A-Za-z /&+\-]{1,44}$/.test(t)) return "";
  return t;
}

async function extractKeywordsFromResume(
  resumeText: string,
  jobDescription = "",
  maxKeywords = 12
): Promise<{ keywords: string[]; jobTitles: string[] }> {
  if (!resumeText || resumeText.trim().length < 50) {
    return { keywords: heuristicKeywords(resumeText).slice(0, maxKeywords), jobTitles: [] };
  }

  const jdContext =
    jobDescription && jobDescription.trim().length > 20
      ? `\n\nTarget job description (align output with this):\n${jobDescription.slice(0, 2000)}`
      : "";

  const fallbackKeywords = heuristicKeywords(`${resumeText}\n${jobDescription}`).slice(0, maxKeywords);

  const prompt = `From this resume text, extract:
1) Exactly ${maxKeywords} job-relevant keywords (skills, tools, domains).
2) Up to 3 clean job titles.

Return strict JSON:
{
  "keywords": ["..."],
  "jobTitles": ["..."]
}

Strict rules for jobTitles:
- role names only (example: Full Stack Developer)
- no names, companies, dates, URLs
- each title 2-5 words and < 40 chars

Resume:
${resumeText.slice(0, 4000)}
${jdContext}`;

  const ai = await generateJsonWithGemini<{ keywords: string[]; jobTitles: string[] }>(prompt, {
    keywords: fallbackKeywords,
    jobTitles: [],
  });

  const keywords = uniqueStrings((Array.isArray(ai.keywords) ? ai.keywords : fallbackKeywords).map(String)).slice(
    0,
    maxKeywords
  );

  const jobTitles = uniqueStrings((Array.isArray(ai.jobTitles) ? ai.jobTitles : []).map(String))
    .map(sanitizeJobTitleCandidate)
    .filter(Boolean)
    .slice(0, 3);

  return { keywords: keywords.length ? keywords : fallbackKeywords, jobTitles };
}

function primaryCvJobTitleForSearch(jobTitles: string[], keywords: string[], resumeText: string): string {
  for (const title of jobTitles) {
    const clean = sanitizeJobTitleCandidate(title);
    if (clean) return clean;
  }
  const lineCandidate = resumeText
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && l.length < 50 && /developer|engineer|manager|analyst|designer/i.test(l));
  if (lineCandidate) return cleanRole(lineCandidate);
  if (keywords.length) return keywords.slice(0, 3).join(" ");
  return "jobs";
}

function buildEthiopiaGoogleJobsQuery(rolePhrase: string, keywords: string[]): string {
  const role = rolePhrase
    .replace(/\s+/g, " ")
    .replace(/\s+jobs?\s+in\s+ethiopia\s*$/i, "")
    .replace(/\s+jobs?\s*$/i, "")
    .trim();
  const picked: string[] = [];
  const stop = new Set([
    "job",
    "jobs",
    "developer",
    "engineer",
    "manager",
    "specialist",
    "officer",
    "ethiopia",
    "addis",
    "ababa",
    "remote",
    "work",
    "full-time",
    "fulltime",
  ]);
  for (const raw of keywords) {
    const token = raw.trim().toLowerCase();
    if (token.length < 3 || token.length > 24) continue;
    if (stop.has(token) || /\d/.test(token)) continue;
    if (!picked.includes(token)) picked.push(token);
    if (picked.length >= 2) break;
  }
  const core = role || "jobs";
  return `${picked.length ? `${core} ${picked.join(" ")}` : core} jobs in ethiopia`;
}

async function rankJobsByRelevance(jobs: JobItem[], resumeText: string, maxToRank = 15): Promise<JobItem[]> {
  if (!jobs.length || !resumeText || resumeText.length < 50) return jobs;
  const toRank = jobs.slice(0, maxToRank);
  const jobsText = toRank
    .map((j, i) => `${i + 1}. ${j.title} at ${j.company}: ${j.snippet.slice(0, 80)}...`)
    .join("\n");

  const prompt = `Score each job's relevance from 1-10 for this resume.
Return strict JSON:
{
  "scores": [8,7,9]
}
Must have exactly ${toRank.length} scores in order.

Resume:
${resumeText.slice(0, 3500)}

Jobs:
${jobsText}`;

  const ai = await generateJsonWithGemini<{ scores: number[] }>(prompt, {
    scores: toRank.map(() => 5),
  });

  const scores = Array.isArray(ai.scores) ? ai.scores.map((n) => (Number.isFinite(n) ? Number(n) : 5)) : [];
  if (scores.length < toRank.length) return jobs;

  const ranked = toRank
    .map((job, idx) => ({ job, score: scores[idx] }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.job);
  return ranked.concat(jobs.slice(maxToRank));
}

function applyLocationPriority(jobs: JobItem[], locationPreference = ""): JobItem[] {
  if (!jobs.length) return jobs;
  const preferredTerms = locationPreference
    ? [locationPreference.toLowerCase()]
    : ["ethiopia", "addis ababa", "ethiopian"];
  return [...jobs]
    .map((job, index) => {
      const bag = `${job.location} ${job.title} ${job.snippet}`.toLowerCase();
      let score = 0;
      for (const term of preferredTerms) {
        if (term && bag.includes(term)) score += 3;
      }
      if (bag.includes("remote")) score += 1;
      return { job, index, score };
    })
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((x) => x.job);
}

function buildQuery(role: string, keywords: string[], location?: string): string {
  const core = uniqueStrings([role, ...keywords.slice(0, 3)]).join(" ");
  return location ? `${core} jobs in ${location}` : `${core} jobs`;
}

export async function recommendJobsFromResume(
  resumeText: string,
  jobDescription: string,
  location?: string
): Promise<JobsResult> {
  const { keywords, jobTitles } = await extractKeywordsFromResume(resumeText, jobDescription, 12);
  const searchKeywords = [...jobTitles.slice(0, 2), ...keywords.slice(0, 5)];
  const primaryTitle = primaryCvJobTitleForSearch(jobTitles, searchKeywords, resumeText);
  const query = buildEthiopiaGoogleJobsQuery(primaryTitle, searchKeywords);
  const raw = await recommendJobs(query, location || "Ethiopia");
  const ranked = await rankJobsByRelevance(raw.jobs, resumeText, Math.min(15, raw.jobs.length || 15));
  const locationSorted = applyLocationPriority(ranked, location || "Ethiopia").slice(0, 15);
  return {
    ...raw,
    jobs: locationSorted,
    searchQuery: query,
    location: location || "Ethiopia",
  };
}

export async function recommendJobs(query: string, location?: string): Promise<JobsResult> {
  if (!env.SERPAPI_API_KEY) {
    return fallbackJobs(query, location, "SERPAPI_API_KEY is missing. Showing fallback recommendations.");
  }

  try {
    const jobs: JobItem[] = [];
    let nextPageToken: string | undefined;
    do {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_jobs");
      url.searchParams.set("q", query);
      url.searchParams.set("location", location || "Ethiopia");
      url.searchParams.set("hl", "en");
      url.searchParams.set("gl", "et");
      url.searchParams.set("api_key", env.SERPAPI_API_KEY);
      if (nextPageToken) {
        url.searchParams.set("next_page_token", nextPageToken);
      }

      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) {
        return fallbackJobs(query, location, "Jobs provider is unavailable right now.");
      }

      const data = (await response.json()) as Record<string, unknown>;
      const jobsRaw = Array.isArray(data.jobs_results)
        ? (data.jobs_results as Array<Record<string, unknown>>)
        : [];

      for (const job of jobsRaw) {
        const applyOptions = Array.isArray(job.apply_options)
          ? (job.apply_options as Array<Record<string, unknown>>)
          : [];
        const firstApply = applyOptions[0] ?? {};
        const link = String(
          firstApply.link ??
            job.share_link ??
            "https://www.linkedin.com/jobs/"
        );
        const detected = (job.detected_extensions as Record<string, unknown> | undefined) ?? {};
        const postedAt = String(detected.posted_at ?? "");
        const desc = String(job.description ?? "").slice(0, 200);
        jobs.push({
          title: String(job.title ?? "Untitled role"),
          company: String(job.company_name ?? "Unknown company"),
          location: String(job.location ?? location ?? ""),
          link,
          snippet: [postedAt, desc].filter(Boolean).join(" · ").slice(0, 220),
          source: String(job.via ?? "google_jobs"),
        });
      }

      const pagination = (data.serpapi_pagination as Record<string, unknown> | undefined) ?? {};
      nextPageToken = typeof pagination.next_page_token === "string" ? pagination.next_page_token : undefined;
    } while (nextPageToken && jobs.length < 15);

    if (!jobs.length) {
      return fallbackJobs(query, location, "No live job results found for this query.");
    }

    const deduped: JobItem[] = [];
    const seen = new Set<string>();
    for (const job of jobs) {
      const key = `${job.title.toLowerCase().slice(0, 50)}|${job.company.toLowerCase().slice(0, 50)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(job);
      if (deduped.length >= 15) break;
    }

    return { searchQuery: query, jobs: deduped, location };
  } catch {
    return fallbackJobs(query, location, "Failed to fetch jobs from provider. Showing fallback recommendations.");
  }
}

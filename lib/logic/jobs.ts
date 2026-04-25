import { env } from "@/lib/env";

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
};

function fallbackJobs(query: string, location?: string): JobsResult {
  return {
    searchQuery: query,
    warning:
      "SerpAPI key is missing or request failed. Returning fallback recommendations.",
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

export async function recommendJobs(query: string, location?: string): Promise<JobsResult> {
  if (!env.SERPAPI_API_KEY) {
    return fallbackJobs(query, location);
  }

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", location ? `${query} in ${location}` : query);
    url.searchParams.set("hl", "en");
    url.searchParams.set("api_key", env.SERPAPI_API_KEY);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return fallbackJobs(query, location);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const jobsRaw = Array.isArray(data.jobs_results)
      ? (data.jobs_results as Array<Record<string, unknown>>)
      : [];

    const jobs: JobItem[] = jobsRaw.slice(0, 10).map((job) => ({
      title: String(job.title ?? "Untitled role"),
      company: String(job.company_name ?? "Unknown company"),
      location: String(job.location ?? location ?? ""),
      link: String(job.related_links && Array.isArray(job.related_links) && job.related_links[0]
        ? (job.related_links[0] as Record<string, unknown>).link ?? "https://www.linkedin.com/jobs/"
        : "https://www.linkedin.com/jobs/"),
      snippet: String(job.description ?? ""),
      source: "serpapi",
    }));

    if (!jobs.length) {
      return fallbackJobs(query, location);
    }

    return { searchQuery: query, jobs };
  } catch {
    return fallbackJobs(query, location);
  }
}

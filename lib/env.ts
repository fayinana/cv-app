import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://nszfjecnbqdsddldkijp.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemZqZWNuYnFkc2RkbGRraWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDE1OTUsImV4cCI6MjA4NzMxNzU5NX0.tX2hc50CrQ-rkVN8n5ktSSr7iBJ-gvxoOPHy9N8-y5U"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemZqZWNuYnFkc2RkbGRraWpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc0MTU5NSwiZXhwIjoyMDg3MzE3NTk1fQ.5xX4iAbncj2jOVnSdTLsyrVmlJgb7EcLmWmu4nZvE0c"),
  GOOGLE_API_KEY: z.string().min(1).default("AIzaSyBG6MmkyLx8u-yMxo2NeqNahRGYhJokGSU"),
  SERPAPI_API_KEY: z.string().min(1).default("eb2c18e1c0e741a56651ccac006c256e7b053a0466e32f1771242cbb910d237b"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn("Environment variables missing; using safe placeholders for build.");
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

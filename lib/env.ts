import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().startsWith("https://").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  SERPAPI_API_KEY: z.string().min(1).optional(),
});
type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn("Environment variables are invalid.", parsed.error.flatten().fieldErrors);
}

export const env: Partial<Env> = parsed.success ? parsed.data : {};

export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  export function getRequiredEnv(name: keyof Env): string {
    const valueByName: Record<keyof Env, string | undefined> = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    };
  
    const value = valueByName[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
  }
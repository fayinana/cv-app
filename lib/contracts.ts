import { z } from "zod";

export const analyzeRequestSchema = z.object({
  jobDescription: z.string().min(20),
  resumeText: z.string().min(20),
  locale: z.enum(["en", "am", "om"]).optional().default("en"),
});

export const jobsRequestSchema = z.object({
  query: z.string().min(2),
  location: z.string().optional(),
});

export const assessRequestSchema = z.object({
  jobDescription: z.string().min(20),
});

export const cvTemplatesRequestSchema = z.object({
  jobDescription: z.string().min(20),
  analysis: z.string().optional(),
});

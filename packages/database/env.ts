import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().describe("DB URL"),
  BETTER_AUTH_SECRET: z.string().describe("Better Auth Secret"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000").describe("Better Auth URL"),
  
  GITHUB_CLIENT_ID: z.string().describe("GitHub Client ID"),
  GITHUB_CLIENT_SECRET: z.string().describe("GitHub Client Secret"),

  
  BASE_URL: z.string().default("http://localhost:8000").describe("Better Auth URL"),
  WEB_URL: z.string().default("http://localhost:3000").describe("Better Auth URL"),

  GOOGLE_CLIENT_ID: z.string().describe("Google Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google Client Secret"),

});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

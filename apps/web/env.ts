import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("4000"),
 NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BASE_URL: z.string().default("http://localhost:4000"),
  WEB_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:4000/trpc"),
  BETTER_AUTH_URL: z.string().default("http://localhost:4000").describe("Better Auth URL"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

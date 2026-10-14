import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("4000"),
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().default("http://localhost:4000"),
  WEB_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().optional().transform((origins) =>
    origins?.split(",").map((origin) => origin.trim()).filter(Boolean),
  ),
  RESPONDENT_COOKIE_SECRET: z.string().min(32),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

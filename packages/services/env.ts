import { z } from "zod";

const envSchema = z.object({
  WEB_URL: z.url().transform((url) => new URL(url).origin),
  OPENAI_API_KEY: z.string().trim().optional(),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid services environment configuration:\n${safeParseResult.error.message}`);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);

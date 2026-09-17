import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().describe("DB URL"),
  BETTER_AUTH_SECRET: z.string().describe("Better Auth Secret"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000").describe("Better Auth URL"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

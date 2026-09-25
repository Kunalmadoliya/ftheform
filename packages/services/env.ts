import { z } from "zod";

const envSchema = z.object({

  BASE_URL: z.string().default("http://localhost:8000").describe("Better Auth URL"),
  WEB_URL: z.string().default("http://localhost:3000").describe("Web URL"),

});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

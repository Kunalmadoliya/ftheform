import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  DEV_DATABASE_URL: z.string().optional(),
  PROD_DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().describe("Better Auth Secret"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000").describe("Better Auth URL"),

  GITHUB_CLIENT_ID: z.string().min(1).describe("GitHub Client ID"),
  GITHUB_CLIENT_SECRET: z.string().min(1).describe("GitHub Client Secret"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),

  BASE_URL: z.string().default("http://localhost:8000").describe("Better Auth URL"),
  WEB_URL: z.string().default("http://localhost:3000").describe("Better Auth URL"),
  TRUSTED_ORIGINS: z.string().optional().transform((origins) =>
    origins?.split(",").map((origin) => origin.trim()).filter(Boolean),
  ),

  GOOGLE_CLIENT_ID: z.string().min(1).describe("Google Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().min(1).describe("Google Client Secret"),
}).superRefine((values, context) => {
  const databaseUrl =
    values.NODE_ENV === "development" ? values.DEV_DATABASE_URL : values.PROD_DATABASE_URL;

  if (!databaseUrl?.trim()) {
    const variableName = values.NODE_ENV === "development" ? "DEV_DATABASE_URL" : "PROD_DATABASE_URL";
    context.addIssue({
      code: "custom",
      path: [variableName],
      message: `${variableName} is required when NODE_ENV=${values.NODE_ENV}`,
    });
  }
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  const databaseUrl =
    safeParseResult.data.NODE_ENV === "development"
      ? safeParseResult.data.DEV_DATABASE_URL
      : safeParseResult.data.PROD_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(`A database URL is required when NODE_ENV=${safeParseResult.data.NODE_ENV}`);
  }

  return { ...safeParseResult.data, DATABASE_URL: databaseUrl };
}

export const env = createEnv(process.env);

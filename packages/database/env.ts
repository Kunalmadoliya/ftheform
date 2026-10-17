import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const publicOrigin = z
  .url()
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return (
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.pathname === "/" &&
        !parsed.search &&
        !parsed.hash
      );
    } catch {
      return false;
    }
  }, "must be an HTTP(S) origin without a path, query, or fragment")
  .transform((url) => new URL(url).origin);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.url().optional(),
    DEV_DATABASE_URL: z.url().optional(),
    PROD_DATABASE_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32)
      .default("development_secret_at_least_32_characters_long"),

    GITHUB_CLIENT_ID: z.string().min(1).default("dummy_github_client_id"),
    GITHUB_CLIENT_SECRET: z.string().min(1).default("dummy_github_client_secret"),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    BASE_URL: publicOrigin.default("http://localhost:4000"),
    WEB_URL: publicOrigin.default("http://localhost:3000"),

    GOOGLE_CLIENT_ID: z.string().min(1).default("dummy_google_client_id"),
    GOOGLE_CLIENT_SECRET: z.string().min(1).default("dummy_google_client_secret"),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV === "production") {
      for (const key of ["BASE_URL", "WEB_URL"] as const) {
        if (new URL(values[key]).protocol !== "https:") {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} must use HTTPS in production`,
          });
        }
      }
    }
  });

function createEnv(rawEnv: NodeJS.ProcessEnv) {
  const envToParse = { ...rawEnv };
  if (!envToParse.BASE_URL || envToParse.BASE_URL === "/") {
    envToParse.BASE_URL = "http://localhost:4000";
  }
  if (!envToParse.WEB_URL || envToParse.WEB_URL === "/") {
    envToParse.WEB_URL = "http://localhost:3000";
  }
  if (envToParse.NODE_ENV === "test" && !envToParse.DATABASE_URL && !envToParse.DEV_DATABASE_URL) {
    envToParse.DATABASE_URL = "postgresql://appuser:ftheform@localhost:5432/ftheform";
  }
  const safeParseResult = envSchema.safeParse(envToParse);
  if (!safeParseResult.success) {
    throw new Error(
      `Invalid database environment configuration:\n${safeParseResult.error.message}`,
    );
  }
  const databaseUrl = safeParseResult.data.DATABASE_URL ??
    (safeParseResult.data.NODE_ENV === "development"
      ? safeParseResult.data.DEV_DATABASE_URL
      : safeParseResult.data.PROD_DATABASE_URL);
  const validatedDatabaseUrl = z.url().safeParse(databaseUrl);
  if (!validatedDatabaseUrl.success) {
    throw new Error(
      `Invalid database environment configuration: set DATABASE_URL, or set the environment-specific ` +
        `DEV_DATABASE_URL/PROD_DATABASE_URL for NODE_ENV=${safeParseResult.data.NODE_ENV}.`,
    );
  }
  return { ...safeParseResult.data, DATABASE_URL: validatedDatabaseUrl.data };
}

export const env = createEnv(process.env);

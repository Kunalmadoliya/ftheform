import { z } from "zod";

const publicOrigin = z.url()
  .refine((url) => {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash;
  }, "must be an HTTP(S) origin without a path, query, or fragment")
  .transform((url) => new URL(url).origin);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32).describe("Better Auth Secret"),

  GITHUB_CLIENT_ID: z.string().min(1).describe("GitHub Client ID"),
  GITHUB_CLIENT_SECRET: z.string().min(1).describe("GitHub Client Secret"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),

  BASE_URL: publicOrigin,
  WEB_URL: publicOrigin,

  GOOGLE_CLIENT_ID: z.string().min(1).describe("Google Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().min(1).describe("Google Client Secret"),
}).superRefine((values, context) => {
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

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid database environment configuration:\n${safeParseResult.error.message}`);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);

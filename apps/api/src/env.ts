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
  PORT: z.coerce.number().int().min(1).max(65535),
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: publicOrigin,
  WEB_URL: publicOrigin,
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  RESPONDENT_COOKIE_SECRET: z.string().min(32),
}).superRefine((values, context) => {
  if (values.NODE_ENV !== "production") return;

  for (const key of ["BASE_URL", "WEB_URL"] as const) {
    const value = new URL(values[key]);
    const hostname = value.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
    const isLocalhost = hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "::1" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname);
    if (value.protocol !== "https:" || isLocalhost) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: `${key} must be a public HTTPS URL in production (received ${values[key]})`,
      });
    }
  }
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid API environment configuration:\n${safeParseResult.error.message}`);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);

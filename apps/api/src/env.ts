import { z } from "zod";

// Validates a single HTTP(S) origin: no path, query, fragment, or wildcards.
const publicOrigin = z
  .url()
  .refine((url) => {
    const parsed = new URL(url);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash
    );
  }, "must be an HTTP(S) origin without a path, query, or fragment")
  .transform((url) => new URL(url).origin);

// Validates and normalises a comma-separated list of additional trusted origins.
// Wildcards are rejected. Each entry is normalised to its bare origin (no trailing slash).
const trustedOriginsEnv = z
  .string()
  .optional()
  .transform((raw) => {
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  })
  .pipe(
    z.array(
      z
        .string()
        .refine(
          (s) => !s.includes("*"),
          "TRUSTED_ORIGINS entries must not contain wildcards",
        )
        .refine(
          (s) => {
            try {
              const u = new URL(s);
              return ["http:", "https:"].includes(u.protocol);
            } catch {
              return false;
            }
          },
          "each TRUSTED_ORIGINS entry must be a valid HTTP(S) URL",
        )
        .transform((s) => new URL(s).origin),
    ),
  );

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535),
    NODE_ENV: z.enum(["development", "production"]),
    BASE_URL: publicOrigin,
    WEB_URL: publicOrigin,
    // Optional comma-separated list of additional trusted origins beyond WEB_URL.
    // Example: TRUSTED_ORIGINS=https://preview.example.com,https://staging.example.com
    TRUSTED_ORIGINS: trustedOriginsEnv,
    DATABASE_URL: z.url().optional(),
    DEV_DATABASE_URL: z.url().optional(),
    PROD_DATABASE_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    RESPONDENT_COOKIE_SECRET: z.string().min(32),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") return;

    for (const key of ["BASE_URL", "WEB_URL"] as const) {
      const value = new URL(values[key]);
      const hostname = value.hostname
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "")
        .toLowerCase();
      const isLocalhost =
        hostname === "localhost" ||
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

function createEnv(rawEnv: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(rawEnv);
  if (!safeParseResult.success) {
    throw new Error(
      `Invalid API environment configuration:\n${safeParseResult.error.message}`,
    );
  }
  const databaseUrl =
    safeParseResult.data.DATABASE_URL ??
    (safeParseResult.data.NODE_ENV === "development"
      ? safeParseResult.data.DEV_DATABASE_URL
      : safeParseResult.data.PROD_DATABASE_URL);
  const validatedDatabaseUrl = z.url().safeParse(databaseUrl);
  if (!validatedDatabaseUrl.success) {
    throw new Error(
      `Invalid API environment configuration: set DATABASE_URL, or set the environment-specific ` +
        `DEV_DATABASE_URL/PROD_DATABASE_URL for NODE_ENV=${safeParseResult.data.NODE_ENV}.`,
    );
  }

  const data = safeParseResult.data;

  // Build the deduplicated trusted-origins list: WEB_URL is always included;
  // additional entries come from TRUSTED_ORIGINS.
  const originSet = new Set([data.WEB_URL, ...(data.TRUSTED_ORIGINS ?? [])]);
  const trustedOrigins = Array.from(originSet);

  // Derive the secure-cookie flag from the BASE_URL protocol rather than NODE_ENV,
  // so the flag is correct even in a custom TLS-terminated development setup.
  const secureCookie = new URL(data.BASE_URL).protocol === "https:";

  return {
    ...data,
    DATABASE_URL: validatedDatabaseUrl.data,
    trustedOrigins,
    secureCookie,
  };
}

export const env = createEnv(process.env);

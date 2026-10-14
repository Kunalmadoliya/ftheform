import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_WEB_URL: z.url().transform((url) => new URL(url).origin),
  NEXT_PUBLIC_API_URL: z.url().refine((url) => {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return ["http:", "https:"].includes(parsed.protocol) && pathname.endsWith("/trpc");
  }, "NEXT_PUBLIC_API_URL must end with /trpc"),
});

const safeParseResult = envSchema.safeParse({
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!safeParseResult.success) {
  throw new Error(`Invalid web environment configuration:\n${safeParseResult.error.message}`);
}

export const env = safeParseResult.data;

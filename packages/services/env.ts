import { z } from "zod";

const envSchema = z.object({
  WEB_URL: z.url().default("http://localhost:3000").transform((url) => new URL(url).origin),
  OPENAI_API_KEY: z.string().trim().optional(),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
  RAZORPAY_KEY_ID: z.string().trim().optional(),
  RAZORPAY_KEY_SECRET: z.string().trim().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().optional(),
  CONTACT_EMAIL: z.string().email().optional(),
  CONTACT_RESEND_API_KEY: z.string().trim().optional(),
  CONTACT_FROM_EMAIL: z.string().trim().optional().default("onboarding@resend.dev"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid services environment configuration:\n${safeParseResult.error.message}`);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);

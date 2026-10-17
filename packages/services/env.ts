import { z } from "zod";

const envSchema = z.object({
  WEB_URL: z.url().default("http://localhost:3000").transform((url) => new URL(url).origin),
  OPENAI_API_KEY: z.string().trim().optional(),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
  RAZORPAY_KEY_ID: z.string().trim().optional(),
  RAZORPAY_KEY_SECRET: z.string().trim().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().optional(),
  CONTACT_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(465),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_FROM: z.string().trim().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid services environment configuration:\n${safeParseResult.error.message}`);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);

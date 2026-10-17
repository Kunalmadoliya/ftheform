import { z } from "zod";

export const userCreditsOutput = z.strictObject({
  credits: z.number().int().min(0),
  dailyFreeRemaining: z.number().int().min(0),
});

export const createRazorpayOrderOutput = z.strictObject({
  orderId: z.string(),
  amount: z.number().int().positive(),
  currency: z.string(),
  keyId: z.string(),
});

export const verifyPaymentInput = z.strictObject({
  orderId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
  signature: z.string().trim().min(1),
});

export const verifyPaymentOutput = z.strictObject({
  status: z.enum(["pending", "captured", "failed"]),
  credits: z.number().int().min(0),
});

export type UserCreditsOutput = z.infer<typeof userCreditsOutput>;
export type CreateRazorpayOrderOutput = z.infer<typeof createRazorpayOrderOutput>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInput>;
export type VerifyPaymentOutput = z.infer<typeof verifyPaymentOutput>;

import { z } from "zod";

export const userCreditsOutput = z.strictObject({
  credits: z.number().int().min(0),
  dailyFreeRemaining: z.number().int().min(0),
});

export type UserCreditsOutput = z.infer<typeof userCreditsOutput>;

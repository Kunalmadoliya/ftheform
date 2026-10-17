import { z } from "zod";

export const sendMessageInput = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must be between 2 and 100 characters")
    .max(100, "Name must be between 2 and 100 characters"),
  email: z.string().trim().email("Please provide a valid email address"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be between 10 and 2000 characters")
    .max(2000, "Message must be between 10 and 2000 characters"),
  honeypot: z.string().optional(),
});

export const sendMessageOutput = z.strictObject({
  success: z.boolean(),
  message: z.string(),
});

export type SendMessageInput = z.infer<typeof sendMessageInput>;
export type SendMessageOutput = z.infer<typeof sendMessageOutput>;

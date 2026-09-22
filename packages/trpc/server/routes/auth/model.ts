import { z } from "zod";

export const signInInput = z.object({
  email: z.string().email().describe("The email of the user"),
  password: z.string().min(8).describe("The password of the user"),
});

export const signUpInput = z.object({
  email: z.string().email().describe("The email of the user"),
  password: z.string().min(8).describe("The password of the user"),
  name: z.string().min(1).describe("The name of the user"),
});

export const signUpOutput = z.object({
  token: z.string().nullable(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export const signInOutput = z.object({
  redirect: z.boolean(),
  token: z.string(),
  url: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});


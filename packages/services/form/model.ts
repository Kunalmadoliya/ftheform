import { z } from "zod";

export const createInitialForm = z.object({
  title: z.string().describe("form title"),
  description: z.string().optional().describe("form description"),
  userId: z.string().describe("user id"),
});

export type CreateInitialFormType = z.infer<typeof createInitialForm>;

export const getFormById = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type GetFormByIdType = z.infer<typeof getFormById>;
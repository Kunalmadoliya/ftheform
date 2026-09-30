import { z } from "zod";

export const validateSubmittedFormVersion = z.object({
  formId: z.string().describe("form id"),
});

export type validateSubmittedFormVersionType = z.infer<typeof validateSubmittedFormVersion>;

export const startSubmissionFormSchema = z.object({
  formId: z.string().describe("form id"),
  status: z.enum(["filling", "submitted", "not_submitted"]).describe("form status"),
  draftAnswer: z.record(z.string(), z.any()).optional().describe("draft answer"),
  submittedAt: z.date().optional().describe("submission date"),
});

export type startSubmissionFormSchemaType = z.infer<typeof startSubmissionFormSchema>;
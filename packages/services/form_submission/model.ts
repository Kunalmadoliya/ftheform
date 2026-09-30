import { z } from "zod";

const userId = z.string().nullable().optional().describe("authenticated user id");

export const startSubmissionFormSchema = z.object({
  formId: z.string().describe("form id"),
  submissionId: z.string().optional().describe("existing submission id"),
  userId,
});

export type startSubmissionFormSchemaType = z.infer<typeof startSubmissionFormSchema>;

export const submissionLookupSchema = z.object({
  submissionId: z.string(),
  formId: z.string().optional(),
  userId,
});

export type submissionLookupSchemaType = z.infer<typeof submissionLookupSchema>;

export const activeSubmissionSchema = z.object({
  formId: z.string(),
  submissionId: z.string().optional(),
  userId,
});

export type activeSubmissionSchemaType = z.infer<typeof activeSubmissionSchema>;

export const updateDraftAnswerSchema = z.object({
  submissionId: z.string(),
  draftAnswer: z.record(z.string(), z.unknown()),
  userId,
});

export type updateDraftAnswerSchemaType = z.infer<typeof updateDraftAnswerSchema>;

export const updateLastActivitySchema = z.object({
  submissionId: z.string(),
  userId,
});

export type updateLastActivitySchemaType = z.infer<typeof updateLastActivitySchema>;

export const submitFormSchema = z.object({
  submissionId: z.string(),
  userId,
});

export type submitFormSchemaType = z.infer<typeof submitFormSchema>;

export const listSubmissionsByFormSchema = z.object({
  formId: z.string(),
  userId: z.string(),
});

export type listSubmissionsByFormSchemaType = z.infer<typeof listSubmissionsByFormSchema>;

export const listSubmissionsByUserSchema = z.object({
  userId: z.string(),
});

export type listSubmissionsByUserSchemaType = z.infer<typeof listSubmissionsByUserSchema>;

export const markNotSubmittedSchema = z.object({
  submissionId: z.string(),
  userId,
});

export type markNotSubmittedSchemaType = z.infer<typeof markNotSubmittedSchema>;

export const validateSubmittedFormVersion = z.object({
  formId: z.string().describe("form id"),
  submissionId: z.string().optional().describe("submission id"),
});

export type validateSubmittedFormVersionType = z.infer<typeof validateSubmittedFormVersion>;
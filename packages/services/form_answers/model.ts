import { z } from "zod";

export const saveFormAnswerInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission to which the answer belongs"),
  fieldId: z.string().describe("The ID of the form field to which the answer corresponds"),
  value: z.unknown().describe("The value of the answer"),
  userId: z.string().nullable().optional().describe("authenticated user id"),
  respondentId: z.string().uuid().nullable().optional().describe("validated respondent cookie id"),
});

export type saveFormAnswerInputType = z.infer<typeof saveFormAnswerInputSchema>;
export const saveAnswerInputSchema = saveFormAnswerInputSchema;
export type SaveAnswerInputType = saveFormAnswerInputType;

export const saveBulkAnswersInputSchema = z.object({
  submissionId: z.string(),
  answers: z.record(z.string(), z.unknown()),
  userId: z.string().nullable().optional(),
  respondentId: z.string().uuid().nullable().optional(),
});

export type SaveBulkAnswersInputType = z.infer<typeof saveBulkAnswersInputSchema>;

export const getAnswersBySubmissionInputSchema = z.object({
  submissionId: z.string(),
  userId: z.string(),
});

export type GetAnswersBySubmissionInputType = z.infer<typeof getAnswersBySubmissionInputSchema>;

export const getAnswersByFieldInputSchema = z.object({
  fieldId: z.string(),
  userId: z.string(),
});

export type GetAnswersByFieldInputType = z.infer<typeof getAnswersByFieldInputSchema>;

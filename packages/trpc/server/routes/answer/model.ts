import { z } from "zod";

export const answerOutput = z.object({
  id: z.string(),
  submissionId: z.string(),
  fieldId: z.string(),
  fieldKey: z.string(),
  value: z.unknown().nullable(),
  createdAt: z.date(),
});

export const saveAnswerInput = z.object({
  submissionId: z.string(),
  fieldId: z.string(),
  value: z.unknown(),
});

export const saveBulkAnswersInput = z.object({
  submissionId: z.string(),
  answers: z.record(z.string(), z.unknown()),
});

export const answersBySubmissionInput = z.object({
  submissionId: z.string(),
});

export const answersByFieldInput = z.object({
  fieldId: z.string(),
});

export const answerOutputSchema = answerOutput;
export const answersOutputSchema = z.array(answerOutput);

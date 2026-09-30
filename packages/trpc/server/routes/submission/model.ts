import { z } from "zod";

export const submissionOutput = z.object({
  id: z.string(),
  formId: z.string(),
  snapshotId: z.string(),
  userId: z.string().nullable(),
  status: z.enum(["filling", "submitted", "not_submitted"]),
  draftAnswer: z.unknown().nullable(),
  allowMultipleSubmissions: z.boolean().nullable(),
  startedAt: z.date(),
  lastActivity: z.date(),
  submittedAt: z.date().nullable(),
  updatedAt: z.date(),
});

export const submissionIdInput = z.object({ submissionId: z.string() });
export const startSubmissionInput = z.object({ formId: z.string(), submissionId: z.string().optional() });
export const draftAnswerInput = z.object({ submissionId: z.string(), draftAnswer: z.record(z.string(), z.unknown()) });
export const formSubmissionsInput = z.object({ formId: z.string() });
export const versionMismatchInput = z.object({ formId: z.string(), submissionId: z.string() });
export const submissionOutputSchema = submissionOutput;
export const submissionsOutputSchema = z.array(submissionOutput);
export const deleteSubmissionOutput = z.object({ id: z.string() });
export const versionMismatchOutput = z.object({ id: z.string(), mismatch: z.boolean() });
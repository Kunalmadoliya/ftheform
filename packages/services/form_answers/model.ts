import { z } from "zod";

export const saveFormAnswerInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission to which the answer belongs"),
  fieldId: z.string().describe("The ID of the form field to which the answer corresponds"),
  value: z.any().describe("The value of the answer, which can be of any type"),
  fieldKey: z.string().describe("The key of the form field to which the answer corresponds"),
});

export type saveFormAnswerInputType = z.infer<typeof saveFormAnswerInputSchema>;

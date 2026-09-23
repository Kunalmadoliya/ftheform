
import { z } from "zod";

export const createFormField = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  type: z.string().describe("form field type"),
  category: z.string().describe("form field category"),
  label: z.string().describe("form field label"),
  required: z.boolean().default(false).describe("whether the form field is required"),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("type-specific settings for the field"),
});

export const listFormFields = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});


export const updateForm  = z.object({
formFieldId : z.string().describe("form field id"),
formId: z.string().describe("form id"),
userId: z.string().describe("user id"),
 type: z.string().optional().describe("form field type"),
 category: z.string().optional().describe("form field category"),
 label: z.string().optional().describe("form field label"),
  required: z.boolean().optional().describe("whether the form field is required"),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("type-specific settings for the field"),
})


export type UpdateFormType = z.infer<typeof updateForm>;
export type ListFormFieldsType = z.infer<typeof listFormFields>;
export type CreateFormFieldType = z.infer<typeof createFormField>;


import { z } from "zod";
import { generatedFieldConfigSchema } from "../form_ai/model";

export const createFormField = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  type: z.string().min(1).describe("form field type"),
  category: z.string().min(1).describe("form field category"),
  label: z.string().trim().min(1).max(120).describe("form field label"),
  required: z.boolean().default(false).describe("whether the form field is required"),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("type-specific settings for the field"),
}).superRefine((field, context) => {
  const parsed = generatedFieldConfigSchema.safeParse({
    type: field.type,
    category: field.category,
    label: field.label,
    required: field.required,
    ...(field.config === undefined ? {} : { config: field.config }),
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      context.addIssue({ code: "custom", message: issue.message, path: issue.path });
    }
  }
});

export const listFormFields = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});


export const updateForm  = z.object({
  formFieldId: z.string().describe("form field id"),
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  type: z.string().optional().describe("form field type"),
  category: z.string().optional().describe("form field category"),
  label: z.string().trim().min(1).max(120).optional().describe("form field label"),
  fieldOrder: z.number().optional().describe("form field order"),
  required: z.boolean().optional().describe("whether the form field is required"),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("type-specific settings for the field"),
});

export const reorderFields = z.object({
  formId: z.string().describe("form id"),
  orderedFieldIds: z.array(z.string()).describe("field ids in their new order"),
  userId: z.string().describe("user id"),
});

export type ReorderFieldsType = z.infer<typeof reorderFields>;

export const deleteFormField = z.object({
  formId: z.string().describe("form id"),
  formFieldId: z.string().describe("form field id"),
  userId: z.string().describe("user id"),
});

export type DeleteFormFieldType = z.infer<typeof deleteFormField>;
export type UpdateFormType = z.infer<typeof updateForm>;
export type ListFormFieldsType = z.infer<typeof listFormFields>;
export type CreateFormFieldType = z.infer<typeof createFormField>;

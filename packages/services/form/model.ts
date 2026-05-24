import { z } from "zod";

// ─── Field Types ──────────────────────────────────────────────────────────────

export const fieldTypeEnum = z.enum([
  "text",
  "email",
  "number",
  "select",
  "radio",
  "checkbox",
  "textarea",
  "date",
  "file",
]);

export type FieldTypeEnum = z.infer<typeof fieldTypeEnum>;

// ─── Form Field (used inside createForm) ─────────────────────────────────────

export const formFieldInput = z.object({
  label: z.string().min(1).describe("Field label"),
  labelKey: z.string().min(1).describe("Unique key for the field (snake_case)"),
  description: z.string().optional().describe("Field description"),
  type: fieldTypeEnum,
  placeholder: z.string().optional().describe("Placeholder text"),
  isRequired: z.boolean().default(false).describe("Whether the field is required"),
  index: z.number().describe("Order/position of the field in the form"),
});

export type FormFieldInputType = z.infer<typeof formFieldInput>;

// ─── Create Form ──────────────────────────────────────────────────────────────

export const createFormInput = z.object({
  title: z.string().min(1).max(255).describe("Form title"),
  description: z.string().optional().describe("Form description"),
  isPublic: z.boolean().default(false).describe("Whether the form is publicly accessible"),
  fields: z.array(formFieldInput).min(1).describe("List of form fields"),
});

export type CreateFormInputType = z.infer<typeof createFormInput>;

// ─── Update Form ──────────────────────────────────────────────────────────────

export const updateFormInput = z.object({
  formId: z.string().uuid().describe("Form ID to update"),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateFormInputType = z.infer<typeof updateFormInput>;

// ─── Get Form by ID ───────────────────────────────────────────────────────────

export const getFormByIdInput = z.object({
  formId: z.string().uuid().describe("Form ID"),
});

export type GetFormByIdInputType = z.infer<typeof getFormByIdInput>;

// ─── Delete Form ──────────────────────────────────────────────────────────────

export const deleteFormInput = z.object({
  formId: z.string().uuid().describe("Form ID to delete"),
});

export type DeleteFormInputType = z.infer<typeof deleteFormInput>;

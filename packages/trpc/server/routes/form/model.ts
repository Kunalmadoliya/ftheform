import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

const fieldTypeEnum = z.enum([
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

const formFieldInputSchema = z.object({
  label: z.string().min(1).describe("Field label"),
  labelKey: z.string().min(1).describe("Unique key for the field (snake_case)"),
  description: z.string().optional().describe("Field description"),
  type: fieldTypeEnum,
  placeholder: z.string().optional().describe("Placeholder text"),
  isRequired: z.boolean().default(false).describe("Whether the field is required"),
  index: z.number().describe("Order/position of the field in the form"),
});

const formFieldOutputSchema = formFieldInputSchema.extend({
  id: z.string().uuid().describe("Field ID"),
});

// ─── createForm ───────────────────────────────────────────────────────────────

export const createFormInputModel = z.object({
  title: z.string().min(1).max(255).describe("Form title"),
  description: z.string().optional().describe("Form description"),
  isPublic: z.boolean().default(false).describe("Whether the form is publicly accessible"),
  fields: z.array(formFieldInputSchema).min(1).describe("List of form fields"),
  
});

export const createFormOutputModel = z.object({
  id: z.string().uuid().describe("ID of the created form"),
  link: z.string().describe("Public shareable link for the form"),
});

// ─── getFormById ──────────────────────────────────────────────────────────────

export const getFormByIdInputModel = z.object({
  formId: z.string().uuid().describe("Form ID"),
});

export const getFormByIdOutputModel = z.object({
  id: z.string().uuid().describe("Form ID"),
  title: z.string().describe("Form title"),
  description: z.string().nullable().describe("Form description"),
  isPublic: z.boolean().describe("Whether the form is publicly accessible"),
  link: z.string().describe("Shareable link"),
  createdBy: z.string().describe("ID of the user who created the form"),
  createdAt: z.string().describe("Creation timestamp"),
  updatedAt: z.string().describe("Last updated timestamp"),
  fields: z.array(formFieldOutputSchema).describe("Form fields"),
});

// ─── getMyForms ───────────────────────────────────────────────────────────────

export const getMyFormsInputModel = z.undefined();

export const getMyFormsOutputModel = z.array(
  z.object({
    id: z.string().uuid().describe("Form ID"),
    title: z.string().describe("Form title"),
    description: z.string().nullable().describe("Form description"),
    isPublic: z.boolean().describe("Whether the form is publicly accessible"),
    link: z.string().describe("Shareable link"),
    createdAt: z.string().describe("Creation timestamp"),
    updatedAt: z.string().describe("Last updated timestamp"),
  })
);

// ─── updateForm ───────────────────────────────────────────────────────────────

export const updateFormInputModel = z.object({
  formId: z.string().uuid().describe("Form ID to update"),
  title: z.string().min(1).max(255).optional().describe("New form title"),
  description: z.string().optional().describe("New form description"),
  isPublic: z.boolean().optional().describe("New visibility setting"),
});

export const updateFormOutputModel = z.object({
  id: z.string().uuid().describe("Form ID"),
  title: z.string().describe("Updated form title"),
  description: z.string().nullable().describe("Updated description"),
  isPublic: z.boolean().describe("Updated visibility"),
  link: z.string().describe("Shareable link"),
});

// ─── deleteForm ───────────────────────────────────────────────────────────────

export const deleteFormInputModel = z.object({
  formId: z.string().uuid().describe("Form ID to delete"),
});

export const deleteFormOutputModel = z.object({
  success: z.boolean().describe("Whether deletion was successful"),
});

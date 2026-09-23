import { z } from "zod";

const formFieldOutput = z.object({
  id: z.string(),
  formId: z.string(),
  fieldKey: z.string(),
  type: z.string(),
  category: z.string(),
  label: z.string(),
  required: z.boolean(),
  config: z.unknown().nullable(),
  fieldOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const listFormFieldsInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const listFormFieldsOutput = z.array(formFieldOutput);

export const createFormFieldInput = z.object({
  formId: z.string().describe("The id of the form"),
  type: z.string().min(1),
  category: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const createFormFieldOutput = formFieldOutput;

export const updateFormFieldInput = z.object({
  formId: z.string().describe("The id of the form"),
  formFieldId: z.string().describe("The id of the form field"),
  type: z.string().optional(),
  category: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateFormFieldOutput = formFieldOutput;

export const deleteFormFieldInput = z.object({
  formId: z.string().describe("The id of the form"),
  formFieldId: z.string().describe("The id of the form field"),
});

export const deleteFormFieldOutput = z.object({
  id: z.string(),
});
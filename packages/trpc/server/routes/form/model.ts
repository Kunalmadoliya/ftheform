import { z } from "zod";

const formOutput = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  formUrl: z.string(),
  isPublished: z.boolean(),
  isOpen: z.boolean(),
  responseLimit: z.number(),
  views: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createInitialFormInput = z.object({
  title: z.string().min(1).describe("The title of the form"),
  description: z.string().optional().describe("The description of the form"),
});

export const createInitialFormOutput = formOutput;

export const getFormByIdInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const getFormByIdOutput = formOutput;

export const getPublicFormByIdOutput = formOutput.extend({
  isOpen: z.boolean(),
});

export const renameFormInput = z.object({
  formId: z.string().describe("The id of the form"),
  title: z.string().min(1).describe("The new title of the form"),
});

export const updateFormDescriptionInput = z.object({
  formId: z.string().describe("The id of the form"),
  description: z.string().nullable().describe("The new description of the form"),
});

export const updateFormOutput = getFormByIdOutput;

export const deleteFormInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const deleteFormOutput = z.object({
  id: z.string().describe("The id of the deleted form"),
});

export const listFormsByUserOutput = z.array(getFormByIdOutput);

export const toggleFormOpenInput = z.object({
  formId: z.string().describe("The id of the form"),
  isOpen: z.boolean().describe("The new open status of the form"),
});

export const toggleFormOpenOutput = getFormByIdOutput;

export const updateFormResponseLimitInput = z.object({
  formId: z.string().describe("The id of the form"),
  responseLimit: z.number().int().min(1),
});

export const updateFormResponseLimitOutput = z.object({
  id: z.string(),
  responseLimit: z.number(),
});

export const updateResponseLimitInput = updateFormResponseLimitInput;
export const updateResponseLimitOutput = updateFormResponseLimitOutput;

export const incrementFormViewCountInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const incrementFormViewCountOutput = z.object({
  id: z.string(),
  views: z.number(),
});

export const publishFormInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const publishFormOutput = formOutput;

export const unpublishFormInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const unpublishFormOutput = formOutput;
import { z } from "zod";

const formOutput = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  formUrl: z.string(),
  isPublished: z.boolean(),
  createdAt: z.date(),
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

export const toggleFormOpenStatusInput = z.object({
  formId: z.string().describe("The id of the form"),
  isOpen: z.boolean().describe("The new open status of the form"),
});

export const toggleFormOpenStatusOutput = getFormByIdOutput;

export const incrementFormViewCountInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const incrementFormViewCountOutput = z.object({
  id: z.string(),
  views: z.number(),
});

export const publishFormInput = z.object({
  formId: z.string().describe("The id of the form"),
  title: z.string().describe("The title of the form"),
});

export const publishFormOutput = formOutput;

export const unpublishFormInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const unpublishFormOutput = formOutput;
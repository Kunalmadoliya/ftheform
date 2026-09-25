import { z } from "zod";

export const createInitialForm = z.object({
  title: z.string().describe("form title"),
  description: z.string().optional().describe("form description"),
  userId: z.string().describe("user id"),
});

export type CreateInitialFormType = z.infer<typeof createInitialForm>;

export const getFormById = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type GetFormByIdType = z.infer<typeof getFormById>;

export const renameForm = z.object({
  formId: z.string().describe("form id"),
  title: z.string().min(1).describe("new form title"),
  userId: z.string().describe("user id"),
});

export type RenameFormType = z.infer<typeof renameForm>;

export const updateFormDescription = z.object({
  formId: z.string().describe("form id"),
  description: z.string().nullable().describe("new form description"),
  userId: z.string().describe("user id"),
});

export type UpdateFormDescriptionType = z.infer<typeof updateFormDescription>;

export const deleteForm = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type DeleteFormType = z.infer<typeof deleteForm>;

export const listFormsByUser = z.object({
  userId: z.string().describe("user id"),
});

export type ListFormsByUserType = z.infer<typeof listFormsByUser>;

export const toggleFormOpenStatus = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  isOpen: z.boolean().describe("new form open status"),
});

export type ToggleFormOpenStatusType = z.infer<typeof toggleFormOpenStatus>;

export const updateFormResponseLimit = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  responseLimit: z.number().int().min(1).describe("new form response limit"),
});

export type UpdateFormResponseLimitType = z.infer<typeof updateFormResponseLimit>;


export const publicForm = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  isPublished: z.boolean().describe("new form published status"),
  title: z.string().describe("form title"),
});

export type PublicFormType = z.infer<typeof publicForm>;
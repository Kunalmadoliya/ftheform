import { z } from "zod";
import { serviceError } from "../errors";

export const formLifecycleSchema = z.enum(["live", "draft", "archived"]);
export type FormLifecycle = z.infer<typeof formLifecycleSchema>;

export function deriveFormLifecycle(isPublished: boolean, isArchived: boolean): FormLifecycle {
  if (isArchived) return "archived";
  return isPublished ? "live" : "draft";
}

export function requireDeleteConfirmation(
  submittedCount: number,
  confirmDeleteResponses: boolean | undefined,
  expectedSubmittedCount: number | undefined,
) {
  if (
    submittedCount > 0 &&
    (confirmDeleteResponses !== true || expectedSubmittedCount !== submittedCount)
  ) {
    throw serviceError("CONFLICT", "Submitted responses changed or require explicit confirmation.");
  }
}

export const createInitialForm = z.object({
  title: z.string().trim().min(1).max(200).describe("form title"),
  description: z.string().max(2000).optional().describe("form description"),
  userId: z.string().describe("user id"),
});

export type CreateInitialFormType = z.infer<typeof createInitialForm>;

export const getFormById = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type GetFormByIdType = z.infer<typeof getFormById>;

export const getPublicFormById = z.object({
  formId: z.string().describe("form id"),
});

export type GetPublicFormByIdType = z.infer<typeof getPublicFormById>;

export const renameForm = z.object({
  formId: z.string().describe("form id"),
  title: z.string().trim().min(1).max(200).describe("new form title"),
  userId: z.string().describe("user id"),
});

export type RenameFormType = z.infer<typeof renameForm>;

export const updateFormDescription = z.object({
  formId: z.string().describe("form id"),
  description: z.string().max(2000).nullable().describe("new form description"),
  userId: z.string().describe("user id"),
});

export type UpdateFormDescriptionType = z.infer<typeof updateFormDescription>;

export const updateFormSettings = z.object({
  formId: z.string().uuid(),
  accessPolicy: z.enum([
    "anonymous_and_authenticated",
    "anonymous_only",
    "authenticated_only",
  ]),
  allowMultipleSubmissions: z.boolean(),
  userId: z.string(),
});

export type UpdateFormSettingsType = z.infer<typeof updateFormSettings>;

export const deleteForm = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
  confirmDeleteResponses: z.boolean().optional(),
  expectedSubmittedCount: z.number().int().min(0).optional(),
});

export type DeleteFormType = z.infer<typeof deleteForm>;

export const archiveForm = z.object({
  formId: z.string().uuid(),
  userId: z.string(),
});

export const restoreForm = archiveForm;

export const getFormDeletionPreview = z.object({
  formId: z.string().uuid(),
  userId: z.string(),
});

export const listFormsByLifecycle = z.object({
  userId: z.string(),
  lifecycle: formLifecycleSchema,
});

export type ListFormsByLifecycleType = z.infer<typeof listFormsByLifecycle>;

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

export const toggleFormOpen = toggleFormOpenStatus;
export type ToggleFormOpenType = ToggleFormOpenStatusType;

export const updateFormResponseLimit = z.object({
  formId: z.string().describe("form id"),
  userRole: z.string().describe("authenticated user role"),
  responseLimit: z.number().int().min(1).describe("new form response limit"),
});

export type UpdateFormResponseLimitType = z.infer<typeof updateFormResponseLimit>;
export const updateResponseLimit = updateFormResponseLimit;
export type UpdateResponseLimitType = UpdateFormResponseLimitType;

export const incrementFormViewCount = z.object({
  formId: z.string().describe("form id"),
  respondentId: z.string().uuid().describe("validated respondent cookie id"),
});

export type IncrementFormViewCountType = z.infer<typeof incrementFormViewCount>;

export const publishForm = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type PublishFormType = z.infer<typeof publishForm>;

export const unpublishForm = publishForm;
export type UnpublishFormType = PublishFormType;
import { z } from "zod";
import { formLifecycleSchema } from "@repo/services/form/model";

const formOutput = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  formUrl: z.string(),
  isPublished: z.boolean(),
  isOpen: z.boolean(),
  responseLimit: z.number(),
  accessPolicy: z.enum([
    "anonymous_and_authenticated",
    "anonymous_only",
    "authenticated_only",
  ]),
  allowMultipleSubmissions: z.boolean(),
  isArchived: z.boolean(),
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

export const getFormByIdOutput = formOutput.extend({
  hasUnpublishedChanges: z.boolean(),
});

export const getPublicFormByIdOutput = formOutput.extend({
  isOpen: z.boolean(),
  isOwner: z.boolean(),
  acceptingResponses: z.boolean(),
});

export const renameFormInput = z.object({
  formId: z.string().describe("The id of the form"),
  title: z.string().min(1).describe("The new title of the form"),
});

export const updateFormDescriptionInput = z.object({
  formId: z.string().describe("The id of the form"),
  description: z.string().nullable().describe("The new description of the form"),
});

export const updateFormSettingsInput = z.object({
  formId: z.string().uuid(),
  accessPolicy: z.enum([
    "anonymous_and_authenticated",
    "anonymous_only",
    "authenticated_only",
  ]),
  allowMultipleSubmissions: z.boolean(),
});

export const updateFormOutput = formOutput;
export const updateFormSettingsOutput = formOutput;

export const deleteFormInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const deleteFormOutput = z.object({
  id: z.string().describe("The id of the deleted form"),
});

export const listFormsByUserOutput = z.array(formOutput);
export const lifecycleFormOutput = formOutput.extend({
  lifecycle: formLifecycleSchema,
  submittedCount: z.number(),
});
export const listFormsByLifecycleInput = z.object({
  lifecycle: formLifecycleSchema,
});
export const listFormsByLifecycleOutput = z.object({
  forms: z.array(lifecycleFormOutput),
  counts: z.object({
    live: z.number(),
    draft: z.number(),
    archived: z.number(),
  }),
});
export const archiveFormInput = z.object({ formId: z.string().uuid() });
export const archiveFormOutput = formOutput.extend({ lifecycle: formLifecycleSchema });
export const restoreFormInput = archiveFormInput;
export const restoreFormOutput = archiveFormOutput;
export const formDeletionPreviewInput = z.object({ formId: z.string().uuid() });
export const formDeletionPreviewOutput = z.object({
  submittedCount: z.number(),
  inProgressCount: z.number(),
  isPublished: z.boolean(),
  isArchived: z.boolean(),
});
export const permanentlyDeleteFormInput = z.object({
  formId: z.string().uuid(),
  confirmDeleteResponses: z.boolean().optional(),
  expectedSubmittedCount: z.number().int().min(0).optional(),
});
export const exportFormCsvInput = formDeletionPreviewInput;
export const exportFormCsvOutput = z.object({
  csv: z.string(),
  submittedCount: z.number(),
});

export const toggleFormOpenInput = z.object({
  formId: z.string().describe("The id of the form"),
  isOpen: z.boolean().describe("The new open status of the form"),
});

export const toggleFormOpenOutput = formOutput;

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
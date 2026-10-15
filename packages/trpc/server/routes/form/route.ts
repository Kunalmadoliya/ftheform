import { randomUUID } from "node:crypto";
import { protectedProcedure, publicProcedure } from "../../trpc";
import {
  createInitialFormInput,
  createInitialFormOutput,
  deleteFormOutput,
  getFormByIdInput,
  getFormByIdOutput,
  getPublicFormByIdOutput,
  incrementFormViewCountInput,
  incrementFormViewCountOutput,
  listFormsByUserOutput,
  archiveFormInput,
  archiveFormOutput,
  restoreFormInput,
  restoreFormOutput,
  listFormsByLifecycleInput,
  listFormsByLifecycleOutput,
  formDeletionPreviewInput,
  formDeletionPreviewOutput,
  permanentlyDeleteFormInput,
  exportFormCsvInput,
  exportFormCsvOutput,
  publishFormInput,
  publishFormOutput,
  renameFormInput,
  updateFormDescriptionInput,
  updateFormSettingsInput,
  updateFormSettingsOutput,
  updateFormOutput,
  unpublishFormInput,
  unpublishFormOutput,
  toggleFormOpenInput,
  toggleFormOpenOutput,
  updateResponseLimitInput,
  updateResponseLimitOutput,
} from "./model";
import { formServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const createInitialFormPath = generatePath("/form");
const getFormByIdPath = generatePath("/form");
const formsPath = generatePath("/form");

const TAGS = ["Form"];

export const formRouter = {
  createInitialForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: createInitialFormPath("/create-form"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(createInitialFormInput)
    .output(createInitialFormOutput)
    .mutation(async ({ ctx, input }) => {
      const { title, description } = input;

      return formServiceInstance.createInitialForm({
        title,
        description,
        userId: ctx.userId,
      });
    }),

  getFormById: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getFormByIdPath("/:formId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(getFormByIdInput)
    .output(getFormByIdOutput)
    .query(async ({ ctx, input }) => {
      const { formId } = input;

      const formById = await formServiceInstance.getFormById({
        formId,
        userId: ctx.userId,
      });

      return formById;
    }),

  getPublicFormById: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getFormByIdPath("/public/:formId"),
        tags: TAGS,
      },
    })
    .input(getFormByIdInput)
    .output(getPublicFormByIdOutput)
    .query(({ ctx, input }) => {
      if (!ctx.respondentId) ctx.setRespondentCookie(randomUUID());
      return formServiceInstance.getPublicFormById(input, ctx.userId);
    }),

  renameForm: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/title"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(renameFormInput)
    .output(updateFormOutput)
    .mutation(async ({ ctx, input }) =>
      formServiceInstance.renameForm({
        ...input,
        userId: ctx.userId,
      }),
    ),

  updateFormDescription: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/description"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(updateFormDescriptionInput)
    .output(updateFormOutput)
    .mutation(async ({ ctx, input }) =>
      formServiceInstance.updateFormDescription({
        ...input,
        userId: ctx.userId,
      }),
    ),

  updateSettings: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/settings"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(updateFormSettingsInput)
    .output(updateFormSettingsOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.updateSettings({
        ...input,
        userId: ctx.userId,
      }),
    ),

  deleteForm: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: formsPath("/:formId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(permanentlyDeleteFormInput)
    .output(deleteFormOutput)
    .mutation(async ({ ctx, input }) =>
      formServiceInstance.deleteForm({
        ...input,
        userId: ctx.userId,
      }),
    ),

  archiveForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/archive"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(archiveFormInput)
    .output(archiveFormOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.archiveForm({ ...input, userId: ctx.userId }),
    ),

  restoreForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/restore"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(restoreFormInput)
    .output(restoreFormOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.restoreForm({ ...input, userId: ctx.userId }),
    ),

  getDeletionPreview: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: formsPath("/:formId/deletion-preview"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(formDeletionPreviewInput)
    .output(formDeletionPreviewOutput)
    .query(({ ctx, input }) =>
      formServiceInstance.getFormDeletionPreview({ ...input, userId: ctx.userId }),
    ),

  exportCsv: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: formsPath("/:formId/export.csv"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(exportFormCsvInput)
    .output(exportFormCsvOutput)
    .query(({ ctx, input }) =>
      formServiceInstance.exportFormCsv({ ...input, userId: ctx.userId }),
    ),

  listFormsByLifecycle: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: formsPath("/lifecycle/forms"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(listFormsByLifecycleInput)
    .output(listFormsByLifecycleOutput)
    .query(({ ctx, input }) =>
      formServiceInstance.listFormsByLifecycle({ ...input, userId: ctx.userId }),
    ),

  listFormsByUser: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: formsPath("/"),
        tags: TAGS,
        protect: true,
      },
    })
    .output(listFormsByUserOutput)
    .query(({ ctx }) =>
      formServiceInstance.listFormsByUser({
        userId: ctx.userId,
      }),
    ),

  toggleFormOpen: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/open-status"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(toggleFormOpenInput)
    .output(toggleFormOpenOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.toggleFormOpen({
        ...input,
        userId: ctx.userId,
      }),
    ),

  updateResponseLimit: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/response-limit"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(updateResponseLimitInput)
    .output(updateResponseLimitOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.updateResponseLimit({
        ...input,
        userRole: ctx.userRole ?? "",
      }),
    ),

  incrementFormViewCount: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/view"),
        tags: TAGS,
      },
    })
    .input(incrementFormViewCountInput)
    .output(incrementFormViewCountOutput)
    .mutation(({ ctx, input }) => {
      const respondentId = ctx.respondentId ?? randomUUID();
      if (!ctx.respondentId) ctx.setRespondentCookie(respondentId);
      return formServiceInstance.incrementFormViewCount({ ...input, respondentId });
    }),

  publishForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/publish"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(publishFormInput)
    .output(publishFormOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.publishForm({
        ...input,
        userId: ctx.userId,
      }),
    ),

  unpublishForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/unpublish"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(unpublishFormInput)
    .output(unpublishFormOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.unpublishForm({
        ...input,
        userId: ctx.userId,
      }),
    ),
};

import { protectedProcedure } from "../../trpc";
import {
  createInitialFormInput,
  createInitialFormOutput,
  deleteFormInput,
  deleteFormOutput,
  getFormByIdInput,
  getFormByIdOutput,
  incrementFormViewCountInput,
  incrementFormViewCountOutput,
  listFormsByUserOutput,
  publishFormInput,
  publishFormOutput,
  renameFormInput,
  updateFormDescriptionInput,
  updateFormOutput,
  unpublishFormInput,
  unpublishFormOutput,
  toggleFormOpenStatusInput,
  toggleFormOpenStatusOutput,
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

  deleteForm: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: formsPath("/:formId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(deleteFormInput)
    .output(deleteFormOutput)
    .mutation(async ({ ctx, input }) =>
      formServiceInstance.deleteForm({
        ...input,
        userId: ctx.userId,
      }),
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

  toggleFormOpenStatus: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formsPath("/:formId/open-status"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(toggleFormOpenStatusInput)
    .output(toggleFormOpenStatusOutput)
    .mutation(({ ctx, input }) =>
      formServiceInstance.toggleFormOpenStatus({
        ...input,
        userId: ctx.userId,
      }),
    ),

  incrementFormViewCount: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formsPath("/:formId/view"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(incrementFormViewCountInput)
    .output(incrementFormViewCountOutput)
    .mutation(({ input }) => formServiceInstance.incrementFormViewCount(input.formId)),

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
        isPublished: true,
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
        isPublished: false,
        title: "",
      }),
    ),
};

import { authenticatedProcedure } from "../../trpc";
import {
  createInitialFormInput,
  createInitialFormOutput,
  deleteFormInput,
  deleteFormOutput,
  getFormByIdInput,
  getFormByIdOutput,
  listFormsByUserOutput,
  renameFormInput,
  updateFormDescriptionInput,
  updateFormOutput,
} from "./model";
import { formServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const createInitialFormPath = generatePath("/form");
const getFormByIdPath = generatePath("/form");
const formsPath = generatePath("/form");

const TAGS = ["Form"];

export const formRouter = {
  createInitialForm: authenticatedProcedure
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

      const { id } = await formServiceInstance.createInitialForm({
        title,
        description,
        userId: ctx.user.id,
      });

      return { id };
    }),

  getFormById: authenticatedProcedure
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
        userId: ctx.user.id,
      });

      return formById;
    }),

  renameForm: authenticatedProcedure
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
        userId: ctx.user.id,
      }),
    ),

  updateFormDescription: authenticatedProcedure
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
        userId: ctx.user.id,
      }),
    ),

  deleteForm: authenticatedProcedure
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
        userId: ctx.user.id,
      }),
    ),

  listFormsByUser: authenticatedProcedure
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
        userId: ctx.user.id,
      }),
    ),
};

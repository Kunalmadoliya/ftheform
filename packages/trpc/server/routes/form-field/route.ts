import { authenticatedProcedure } from "../../trpc";
import { formFieldServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";
import {
  createFormFieldInput,
  createFormFieldOutput,
  deleteFormFieldInput,
  deleteFormFieldOutput,
  listFormFieldsInput,
  listFormFieldsOutput,
  updateFormFieldInput,
  updateFormFieldOutput,
} from "./model";

const formFieldsPath = generatePath("/form/:formId/fields");
const TAGS = ["Form field"];

export const formFieldRouter = {
  listFormFields: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: formFieldsPath("/"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(listFormFieldsInput)
    .output(listFormFieldsOutput)
    .query(({ ctx, input }) =>
      formFieldServiceInstance.listFormFields({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  createFormField: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: formFieldsPath("/"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(createFormFieldInput)
    .output(createFormFieldOutput)
    .mutation(({ ctx, input }) =>
      formFieldServiceInstance.createFormField({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  updateFormField: authenticatedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: formFieldsPath("/:formFieldId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(updateFormFieldInput)
    .output(updateFormFieldOutput)
    .mutation(({ ctx, input }) =>
      formFieldServiceInstance.updateFormField({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  deleteFormField: authenticatedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: formFieldsPath("/:formFieldId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(deleteFormFieldInput)
    .output(deleteFormFieldOutput)
    .mutation(({ ctx, input }) =>
      formFieldServiceInstance.deleteFormField(input.formId, input.formFieldId, ctx.user.id),
    ),
};
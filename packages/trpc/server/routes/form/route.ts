import { authenticatedProcedure } from "../../trpc";
import {
  createInitialFormInput,
  createInitialFormOutput,
  getFormByIdInput,
  getFormByIdOutput,
} from "./model";
import { formServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const createInitialFormPath = generatePath("/form");
const getFormByIdPath = generatePath("/form");

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
};

import { authenticatedProcedure } from "../../trpc";
import { createInitialFormInput, createInitialFormOutput } from "./model";
import { formServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const createInitialFormPath = generatePath("/form");
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
};

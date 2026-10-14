import { formAiServiceInstance } from "../../services";
import { authenticatedProcedure } from "../../trpc";
import {
  formGenerationJobOutput,
  getFormGenerationStatusInput,
  startFormGenerationInput,
} from "@repo/services/form_ai/model";

export const formAiRouter = {
  startGeneration: authenticatedProcedure
    .input(startFormGenerationInput)
    .output(formGenerationJobOutput)
    .mutation(({ ctx, input }) =>
      formAiServiceInstance.startGeneration(input, ctx.userId),
    ),

  getGenerationStatus: authenticatedProcedure
    .input(getFormGenerationStatusInput)
    .output(formGenerationJobOutput)
    .query(({ ctx, input }) =>
      formAiServiceInstance.getStatus(input, ctx.userId),
    ),
};

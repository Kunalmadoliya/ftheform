import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { formAnswerServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";
import {
  answerOutputSchema,
  answersByFieldInput,
  answersBySubmissionInput,
  answersOutputSchema,
  saveAnswerInput,
  saveBulkAnswersInput,
} from "./model";

const answersPath = generatePath("/answer");
const TAGS = ["Answer"];

export const answerRouter = router({
  saveAnswer: publicProcedure
    .meta({ openapi: { method: "POST", path: answersPath("/"), tags: TAGS } })
    .input(saveAnswerInput)
    .output(answerOutputSchema)
    .mutation(({ ctx, input }) =>
      formAnswerServiceInstance.saveAnswer({
        ...input,
        userId: ctx.userId,
      }),
    ),

  saveBulkAnswers: publicProcedure
    .meta({ openapi: { method: "PUT", path: answersPath("/bulk"), tags: TAGS } })
    .input(saveBulkAnswersInput)
    .output(answersOutputSchema)
    .mutation(({ ctx, input }) =>
      formAnswerServiceInstance.saveBulkAnswers({
        ...input,
        userId: ctx.userId,
      }),
    ),

  getAnswersBySubmission: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: answersPath("/submission/:submissionId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(answersBySubmissionInput)
    .output(answersOutputSchema)
    .query(({ ctx, input }) =>
      formAnswerServiceInstance.getAnswersBySubmission({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  getAnswersByField: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: answersPath("/field/:fieldId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(answersByFieldInput)
    .output(answersOutputSchema)
    .query(({ ctx, input }) =>
      formAnswerServiceInstance.getAnswersByField({
        ...input,
        userId: ctx.user.id,
      }),
    ),
});

import { protectedProcedure, publicProcedure } from "../../trpc";
import { versionMismatchOutput } from "./model";
import { formSubmissionServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";
import {
  draftAnswerInput,
  formSubmissionsInput,
  startSubmissionInput,
  submissionIdInput,
  submissionOutputSchema,
  startSubmissionOutput,
  submissionsOutputSchema,
  versionMismatchInput,
  deleteSubmissionOutput,
} from "./model";

const submissionsPath = generatePath("/submission");
const TAGS = ["Submission"];

export const submissionRouter = {
  startSubmission: publicProcedure
    .meta({ openapi: { method: "POST", path: submissionsPath("/start"), tags: TAGS } })
    .input(startSubmissionInput)
    .output(startSubmissionOutput)
    .mutation(async ({ ctx, input }) => {
      const result = await formSubmissionServiceInstance.startSubmission({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      });
      if (result.respondentIdToSet) ctx.setRespondentCookie(result.respondentIdToSet);
      return result.outcome === "already_submitted"
        ? {
            status: "already_submitted" as const,
            formId: result.formId,
            submittedAt: result.submittedAt,
          }
        : result.submission;
    }),

  getActiveSubmission: publicProcedure
    .meta({ openapi: { method: "GET", path: submissionsPath("/active/:formId"), tags: TAGS } })
    .input(startSubmissionInput)
    .output(submissionOutputSchema)
    .query(({ ctx, input }) =>
      formSubmissionServiceInstance.getActiveSubmission({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    ),

  getSubmissionById: protectedProcedure
    .meta({
      openapi: { method: "GET", path: submissionsPath("/:submissionId"), tags: TAGS, protect: true },
    })
    .input(submissionIdInput)
    .output(submissionOutputSchema)
    .query(({ ctx, input }) =>
      formSubmissionServiceInstance.getSubmissionById({ ...input, userId: ctx.userId }),
    ),

  updateDraftAnswer: publicProcedure
    .meta({ openapi: { method: "PATCH", path: submissionsPath("/:submissionId/draft"), tags: TAGS } })
    .input(draftAnswerInput)
    .output(submissionOutputSchema)
    .mutation(({ ctx, input }) =>
      formSubmissionServiceInstance.updateDraftAnswer({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    ),

  updateLastActivity: publicProcedure
    .meta({ openapi: { method: "PATCH", path: submissionsPath("/:submissionId/activity"), tags: TAGS } })
    .input(submissionIdInput)
    .output(submissionOutputSchema)
    .mutation(({ ctx, input }) =>
      formSubmissionServiceInstance.updateLastActivity({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    ),

  submitForm: publicProcedure
    .meta({ openapi: { method: "POST", path: submissionsPath("/:submissionId/submit"), tags: TAGS } })
    .input(submissionIdInput)
    .output(submissionOutputSchema)
    .mutation(({ ctx, input }) =>
      formSubmissionServiceInstance.submitForm({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    ),

  markNotSubmitted: publicProcedure
    .meta({ openapi: { method: "POST", path: submissionsPath("/:submissionId/not-submitted"), tags: TAGS } })
    .input(submissionIdInput)
    .output(submissionOutputSchema)
    .mutation(({ ctx, input }) =>
      formSubmissionServiceInstance.markNotSubmitted({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    ),

  checkVersionMismatch: publicProcedure
    .meta({ openapi: { method: "GET", path: submissionsPath("/:submissionId/version"), tags: TAGS } })
    .input(versionMismatchInput)
    .output(versionMismatchOutput)
    .query(async ({ ctx, input }) => ({
      id: input.submissionId,
      mismatch: await formSubmissionServiceInstance.checkVersionMismatch({
        ...input,
        userId: ctx.userId,
        respondentId: ctx.respondentId,
      }),
    })),

  listSubmissionsByForm: protectedProcedure
    .meta({
      openapi: { method: "GET", path: submissionsPath("/form/:formId"), tags: TAGS, protect: true },
    })
    .input(formSubmissionsInput)
    .output(submissionsOutputSchema)
    .query(({ ctx, input }) =>
      formSubmissionServiceInstance.listSubmissionsByForm({ ...input, userId: ctx.userId }),
    ),

  listSubmissionsByUser: protectedProcedure
    .meta({ openapi: { method: "GET", path: submissionsPath("/user"), tags: TAGS, protect: true } })
    .output(submissionsOutputSchema)
    .query(({ ctx }) => formSubmissionServiceInstance.listSubmissionsByUser({ userId: ctx.userId })),

  deleteSubmission: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: submissionsPath("/:submissionId"),
        tags: TAGS,
        protect: true,
      },
    })
    .input(submissionIdInput)
    .output(deleteSubmissionOutput)
    .mutation(({ ctx, input }) =>
      formSubmissionServiceInstance.deleteSubmission({
        ...input,
        userId: ctx.userId,
      }),
    ),
};

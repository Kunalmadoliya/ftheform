import { NonRetriableError } from "inngest";
import { inngest } from "./inngest-client";
import { formAiServiceInstance, safeGenerationError } from "./index";
import { isOpenAiConfigurationError } from "./client";
import { env } from "../env";
import { GeneratedFieldsValidationError, type GeneratedFields } from "./model";

export const generateFormFieldsFunction = inngest.createFunction(
  {
    id: "generate-form-fields",
    triggers: [{ event: "form/generation.requested" }],
    retries: 3,
    onFailure: async ({ event }) => {
      const jobId = event.data.event.data.jobId;
      await formAiServiceInstance.markFailed(jobId, safeGenerationError);
    },
  },
  async ({ event, step }) => {
    const job = await step.run("load-generation-job", () =>
      formAiServiceInstance.getJobForProcessing(event.data.jobId),
    );
    if (!job) return { status: "completed" };
    if (job.status === "completed") return { status: "completed" };
    if (job.status === "failed") throw new NonRetriableError("Form generation job has failed");
    if (!env.OPENAI_API_KEY) {
      await formAiServiceInstance.markFailed(job.id, "AI form generation is not configured.");
      throw new NonRetriableError("AI form generation is not configured.");
    }

    await step.run("mark-generation-running", () =>
      formAiServiceInstance.markRunning(job.id),
    );
    let fields: GeneratedFields;
    try {
      fields = await step.run("generate-fields", () =>
        formAiServiceInstance.generateFields(job.prompt),
      );
    } catch (error) {
      if (isOpenAiConfigurationError(error)) {
        throw new NonRetriableError("OpenAI rejected the configured API credentials or model.");
      }
      if (error instanceof GeneratedFieldsValidationError) {
        throw new NonRetriableError(error.message);
      }
      throw error;
    }
    await step.run("persist-generated-fields", () =>
      formAiServiceInstance.completeGeneration(job.id, fields),
    );
    return { status: "completed" };
  },
);

export const failStaleFormGenerationJobsFunction = inngest.createFunction(
  { id: "fail-stale-form-generation-jobs", triggers: [{ cron: "*/5 * * * *" }] },
  async ({ step }) =>
    step.run("fail-stale-form-generation-jobs", () =>
      formAiServiceInstance.failStaleJobs(),
    ),
);

export const clearExpiredFormGenerationPromptsFunction = inngest.createFunction(
  { id: "clear-expired-form-generation-prompts", triggers: [{ cron: "0 4 * * *" }] },
  async ({ step }) =>
    step.run("clear-expired-form-generation-prompts", () =>
      formAiServiceInstance.clearExpiredPrompts(),
    ),
);

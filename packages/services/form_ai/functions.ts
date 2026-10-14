import { inngest } from "./inngest-client";
import { formAiServiceInstance, safeGenerationError } from "./index";

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
    if (job.status === "completed") return { status: "completed" };
    if (job.status === "failed") throw new Error("Form generation job has failed");

    await step.run("mark-generation-running", () =>
      formAiServiceInstance.markRunning(job.id),
    );
    const fields = await step.run("generate-fields", () =>
      formAiServiceInstance.generateFields(job.prompt),
    );
    await step.run("persist-generated-fields", () =>
      formAiServiceInstance.completeGeneration(job.id, fields),
    );
    return { status: "completed" };
  },
);

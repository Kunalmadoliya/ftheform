import { inngest } from "../form_ai/inngest-client";
import SubmissionService from "./index";

const submissionService = new SubmissionService();

export const expireInactiveSubmissionsFunction = inngest.createFunction(
  { id: "expire-inactive-form-submissions", triggers: [{ cron: "0 3 * * *" }] },
  async ({ step }) =>
    step.run("expire-inactive-form-submissions", () =>
      submissionService.markInactiveSubmissionsNotSubmitted(),
    ),
);

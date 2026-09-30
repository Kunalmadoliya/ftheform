import { form, formSnapshot, submission } from "@repo/database/schema";
import { and, db, desc, eq } from "@repo/database";
import {
  validateSubmittedFormVersion,
  type validateSubmittedFormVersionType,
  startSubmissionFormSchema,
  type startSubmissionFormSchemaType,
} from "./model";

export default class FormSubmission {
  private async validateFormVersion(input: validateSubmittedFormVersionType) {
    const { formId } = await validateSubmittedFormVersion.parseAsync(input);

    const [validatedForm] = await db
      .select({ currentVersion: form.currentVersion })
      .from(form)
      .where(eq(form.id, formId));

    if (!validatedForm) {
      throw new Error("Form not found");
    }

    const [matchingSnapshot] = await db
      .select()
      .from(formSnapshot)
      .where(
        and(
          eq(formSnapshot.formId, formId),
          eq(formSnapshot.versions, validatedForm.currentVersion),
        ),
      );

    if (!matchingSnapshot) {
      throw new Error("Form snapshot not found");
    }

    return matchingSnapshot;
  }

  public async startSubmissionForm(input: startSubmissionFormSchemaType) {
    const { formId } = await startSubmissionFormSchema.parseAsync(input);

    const matchingSnapshot = await this.validateFormVersion({ formId });

    const [newSubmission] = await db
      .insert(submission)
      .values({
        formId,
        snapshotId: matchingSnapshot.id,
        status: "filling",
        submittedAt: null,
      })
      .returning();

    if (!newSubmission) {
      throw new Error("Failed to start submission");
    }

    return newSubmission;
  }

  public async getActiveSubmission(formId: string) {
    const activeSubmission = await db
      .select()
      .from(submission)
      .where(and(eq(submission.formId, formId), eq(submission.status, "filling")));

    if (!activeSubmission) {
      throw new Error("Active submission not found");
    }

    return activeSubmission;
  }

  public async submitForm(formId: string, submissionId: string) {
    const matchingSnapshot = await this.validateFormVersion({ formId });

    const [updatedSubmission] = await db
      .update(submission)
      .set({
        snapshotId: matchingSnapshot.id,
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(submission.id, submissionId))
      .returning();

    if (!updatedSubmission) {
      throw new Error("Failed to submit form");
    }

    return updatedSubmission;
  }

  public async getSubmissionById(submissionId: string) {
    const [submissionRecord] = await db
      .select()
      .from(submission)
      .where(eq(submission.id, submissionId));

    if (!submissionRecord) {
      throw new Error("Submission not found");
    }

    return submissionRecord;
  }

  public async listSubmissionsByFormId(formId: string) {
    return db
      .select()
      .from(submission)
      .where(eq(submission.formId, formId))
      .orderBy(desc(submission.startedAt));
  }

  public async markSubmissionAsNotSubmitted(submissionId: string) {
    const getActiveSubmission = await this.getSubmissionById(submissionId);


    if (getActiveSubmission.status === "filling" && getActiveSubmission.startedAt < new Date(Date.now() - 3 * 60 * 60 * 1000)) {
      const [updatedSubmission] = await db
        .update(submission)
        .set({
          status: "not_submitted",
        })
        .where(eq(submission.id, submissionId))
        .returning();

      if (!updatedSubmission) {
        throw new Error("Failed to mark submission as not submitted");
      }

      return updatedSubmission;
    }
  }
}

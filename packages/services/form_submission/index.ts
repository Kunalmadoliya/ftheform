import { form, formSnapshot, submission } from "@repo/database/schema";
import { and, db, eq } from "@repo/database";
import { validateSubmittedFormVersion, type validateSubmittedFormVersionType } from "./model";

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

  public async startSubmissionForm(formId: string) {
    if (!formId) {
      throw new Error("Form id is required");
    }

    const matchingSnapshot = await this.validateFormVersion({ formId });

    if (!matchingSnapshot) {
      throw new Error("Form with current version not found try to contact the form owner to update the form");
    }
    
    const createFormSubmission = await db.insert(submission).values({
      formId,
      snapshotId: matchingSnapshot.id,
    }).returning();

    return createFormSubmission;
  }
}

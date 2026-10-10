import { and, db, eq } from "@repo/database";
import {
  formField,
  answer,
  submission,
  form,
  formSnapshot,
} from "@repo/database/models/form-schema";
import { saveFormAnswerInputSchema, type saveFormAnswerInputType } from "./model";

export class FormAnswerService {
  private async getSnapshotForSubmission(submissionId: string) {
    if (!submissionId) throw new Error("Submission ID is required");

    const [submissionRecord] = await db
      .select()
      .from(submission)
      .where(and(eq(submission.id, submissionId), eq(submission.status, "submitted")))
      .limit(1);

    if (!submissionRecord) throw new Error("Submission not found");

    const [snapshot] = await db
      .select()
      .from(formSnapshot)
      .where(eq(formSnapshot.id, submissionRecord.snapshotId))
      .limit(1);

    if (!snapshot) throw new Error("Form snapshot not found");

    return { submissionRecord, snapshot };
  }

  public async saveFormAnswer(input: saveFormAnswerInputType) {
    const { submissionId, fieldId, value, fieldKey } =  saveFormAnswerInputSchema.parse(input);

    const validation = await this.getSnapshotForSubmission(submissionId);

    if (!validation) throw new Error("Invalid submission or snapshot");

    const [existingAnswer] = await db
      .select()
      .from(answer)
      .where(
        and(
          eq(answer.submissionId, submissionId),
          eq(answer.fieldId, fieldId),
          eq(answer.fieldKey, fieldKey),
        ),
      )
      .limit(1);

    if (existingAnswer) {
      await db.update(answer).set({ value }).where(eq(answer.id, existingAnswer.id));
    } else {
      await db.insert(answer).values({
        submissionId,
        fieldId,
        fieldKey,
        value,
      });
    }

    return existingAnswer;
  }
}

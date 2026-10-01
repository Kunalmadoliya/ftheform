import { db, eq } from "@repo/database";
import { formField, answer, submission, form } from "@repo/database/models/form-schema";
import { saveFormAnswerInputSchema, type saveFormAnswerInputType } from "./model";

export class FormAnswerService {
  private async validateForm(submissionId: string, fieldId: string) {
    const getSubmission = await db
      .select()
      .from(submission)
      .where(eq(submission.id, submissionId))
      .limit(1);

    if (getSubmission.length === 0) {
      throw new Error(`Submission with ID ${submissionId} does not exist.`);
    }

    const getField = await db
      .select()
      .from(formField)
      .where(eq(formField.id, fieldId))
      .limit(1);

      if (getField.length === 0) {
        throw new Error(`Form field with ID ${fieldId} does not exist.`);
      }

      return { submission: getSubmission[0], field: getField[0] };
  }

  public async saveFormAnswer(input: saveFormAnswerInputType) {
    const { submissionId, fieldId, value, fieldKey } =
      await saveFormAnswerInputSchema.parseAsync(input);

    await this.validateForm(submissionId, fieldId);

    const insertAnswer = await db.insert(answer).values({
      submissionId,
      fieldId,
      value,
      fieldKey,
    });

    return insertAnswer;
  }
}

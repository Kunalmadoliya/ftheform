import { and, db, eq } from "@repo/database";
import { answer, form, formField, formSnapshot, submission } from "@repo/database/models/form-schema";
import {
  getAnswersByFieldInputSchema,
  getAnswersBySubmissionInputSchema,
  saveBulkAnswersInputSchema,
  saveAnswerInputSchema,
  saveFormAnswerInputSchema,
  type GetAnswersByFieldInputType,
  type GetAnswersBySubmissionInputType,
  type SaveBulkAnswersInputType,
  type SaveAnswerInputType,
  type saveFormAnswerInputType,
} from "./model";
import { z } from "zod";

export default class AnswerService {
  public async saveAnswer(input: SaveAnswerInputType) {
    const { submissionId, fieldId, value, userId } = await saveAnswerInputSchema.parseAsync(input);
    const [savedAnswer] = await this.saveBulkAnswers({
      submissionId,
      answers: { [fieldId]: value },
      userId,
    });
    if (!savedAnswer) throw new Error("Failed to save answer");
    return savedAnswer;
  }

  public async saveFormAnswer(input: saveFormAnswerInputType) {
    return this.saveAnswer(await saveFormAnswerInputSchema.parseAsync(input));
  }

  public async saveBulkAnswers(input: SaveBulkAnswersInputType) {
    const { submissionId, answers } = await saveBulkAnswersInputSchema.parseAsync(input);
    const userId = input.userId;

    return db.transaction(async (tx) => {
      const [submissionRecord] = await tx
        .select()
        .from(submission)
        .where(eq(submission.id, submissionId))
        .limit(1);
      if (
        !submissionRecord ||
        (userId !== undefined && submissionRecord.userId !== (userId ?? null))
      ) {
        throw new Error("Submission not found");
      }
      if (submissionRecord.status !== "filling") {
        throw new Error("Submission is already finalized");
      }

      const [snapshot] = await tx
        .select()
        .from(formSnapshot)
        .where(eq(formSnapshot.id, submissionRecord.snapshotId))
        .limit(1);
      if (!snapshot) throw new Error("Form snapshot not found");

      const snapshotFields = z
        .array(z.object({ id: z.string(), fieldKey: z.string() }))
        .safeParse(snapshot.fieldsJson);
      if (!snapshotFields.success) throw new Error("Form snapshot fields are invalid");
      const fieldsById = new Map(snapshotFields.data.map((field) => [field.id, field]));
      const requestedFieldIds = Object.keys(answers);
      if (requestedFieldIds.some((fieldId) => !fieldsById.has(fieldId))) {
        throw new Error("Answer contains a field that is not in the submission snapshot");
      }

      const savedAnswers = [];
      for (const [fieldId, value] of Object.entries(answers)) {
        const field = fieldsById.get(fieldId);
        if (!field) throw new Error("Form field not found in submission snapshot");
        const [existingAnswer] = await tx
          .select()
          .from(answer)
          .where(and(eq(answer.submissionId, submissionId), eq(answer.fieldId, fieldId)))
          .limit(1);

        if (existingAnswer) {
          const [updatedAnswer] = await tx
            .update(answer)
            .set({ value, fieldKey: field.fieldKey })
            .where(eq(answer.id, existingAnswer.id))
            .returning();
          if (!updatedAnswer) throw new Error("Failed to update answer");
          savedAnswers.push(updatedAnswer);
        } else {
          const [newAnswer] = await tx
            .insert(answer)
            .values({ submissionId, fieldId, fieldKey: field.fieldKey, value })
            .returning();
          if (!newAnswer) throw new Error("Failed to save answer");
          savedAnswers.push(newAnswer);
        }
      }

      return savedAnswers;
    });
  }

  public async getAnswersBySubmission(input: GetAnswersBySubmissionInputType) {
    const { submissionId, userId } = await getAnswersBySubmissionInputSchema.parseAsync(input);
    const [ownedSubmission] = await db
      .select({ id: submission.id })
      .from(submission)
      .innerJoin(form, eq(submission.formId, form.id))
      .where(
        and(
          eq(submission.id, submissionId),
          eq(submission.status, "submitted"),
          eq(form.userId, userId),
        ),
      )
      .limit(1);
    if (!ownedSubmission) throw new Error("Submission not found");

    return db.select().from(answer).where(eq(answer.submissionId, submissionId));
  }

  public async getAnswersByField(input: GetAnswersByFieldInputType) {
    const { fieldId, userId } = await getAnswersByFieldInputSchema.parseAsync(input);
    const [ownedField] = await db
      .select({ id: formField.id })
      .from(formField)
      .innerJoin(form, eq(formField.formId, form.id))
      .where(and(eq(formField.id, fieldId), eq(form.userId, userId)))
      .limit(1);
    if (!ownedField) throw new Error("Form field not found");

    return db
      .select({
        id: answer.id,
        submissionId: answer.submissionId,
        fieldId: answer.fieldId,
        fieldKey: answer.fieldKey,
        value: answer.value,
        createdAt: answer.createdAt,
      })
      .from(answer)
      .innerJoin(submission, eq(answer.submissionId, submission.id))
      .where(and(eq(answer.fieldId, fieldId), eq(submission.status, "submitted")));
  }
}

export { AnswerService as FormAnswerService };

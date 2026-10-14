import { and, db, eq, isNull } from "@repo/database";
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
import { assertFormAccess } from "../form/access";
import { validateSnapshotDraft } from "../form_submission/draft-validation";
import { serviceError } from "../errors";

export default class AnswerService {
  public async saveAnswer(input: SaveAnswerInputType) {
    const { submissionId, fieldId, value, userId, respondentId } =
      await saveAnswerInputSchema.parseAsync(input);
    const [savedAnswer] = await this.saveBulkAnswers({
      submissionId,
      answers: { [fieldId]: value },
      userId,
      respondentId,
    });
    if (!savedAnswer) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to save answer");
    return savedAnswer;
  }

  public async saveFormAnswer(input: saveFormAnswerInputType) {
    return this.saveAnswer(await saveFormAnswerInputSchema.parseAsync(input));
  }

  public async saveBulkAnswers(input: SaveBulkAnswersInputType) {
    const { submissionId, answers, respondentId } = await saveBulkAnswersInputSchema.parseAsync(input);
    const userId = input.userId;
    const identityCondition = userId
      ? eq(submission.userId, userId)
      : respondentId
        ? and(isNull(submission.userId), eq(submission.respondentId, respondentId))
        : undefined;
    if (!identityCondition) throw serviceError("UNAUTHORIZED", "A valid respondent identity is required");

    return db.transaction(async (tx) => {
      const [submissionResult] = await tx
        .select({
          submissionRecord: submission,
          accessPolicy: form.accessPolicy,
          isArchived: form.isArchived,
          ownerId: form.userId,
        })
        .from(submission)
        .innerJoin(form, eq(submission.formId, form.id))
        .where(and(eq(submission.id, submissionId), identityCondition))
        .limit(1)
        .for("update");
      if (!submissionResult) throw serviceError("NOT_FOUND", "Submission not found");
      const { submissionRecord } = submissionResult;
      if (submissionResult.isArchived || !submissionResult.ownerId) {
        throw serviceError("FORBIDDEN", "Form is archived");
      }
      assertFormAccess(submissionResult.accessPolicy, userId);
      if (submissionRecord.status !== "filling") {
        throw serviceError("CONFLICT", "Submission is already finalized");
      }

      const [snapshot] = await tx
        .select()
        .from(formSnapshot)
        .where(eq(formSnapshot.id, submissionRecord.snapshotId))
        .limit(1);
      if (!snapshot) throw serviceError("NOT_FOUND", "Form snapshot not found");

      const validatedAnswers = validateSnapshotDraft(
        snapshot.fieldsJson,
        answers,
        { requireRequired: false },
      );
      const fieldsById = new Map(validatedAnswers.fields.map((field) => [field.id, field]));
      const requestedFieldIds = Object.keys(answers);
      if (requestedFieldIds.some((fieldId) => !fieldsById.has(fieldId))) {
        throw serviceError("BAD_REQUEST", "Answer contains a field that is not in the submission snapshot");
      }

      const savedAnswers = [];
      for (const [fieldId, value] of Object.entries(answers)) {
        const field = fieldsById.get(fieldId);
        if (!field) throw serviceError("BAD_REQUEST", "Form field is not in the submission snapshot");
        const [currentField] = await tx
          .select({ id: formField.id })
          .from(formField)
          .where(
            and(
              eq(formField.id, fieldId),
              eq(formField.formId, submissionRecord.formId),
              eq(formField.fieldKey, field.fieldKey),
            ),
          )
          .limit(1)
          .for("key share");
        const answerFieldId = currentField?.id ?? null;
        const [existingAnswer] = await tx
          .select()
          .from(answer)
          .where(and(eq(answer.submissionId, submissionId), eq(answer.fieldKey, field.fieldKey)))
          .limit(1);

        if (existingAnswer) {
          const [updatedAnswer] = await tx
            .update(answer)
            .set({ fieldId: answerFieldId, value })
            .where(eq(answer.id, existingAnswer.id))
            .returning();
          if (!updatedAnswer) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to update answer");
          savedAnswers.push(updatedAnswer);
        } else {
          const [newAnswer] = await tx
            .insert(answer)
            .values({ submissionId, fieldId: answerFieldId, fieldKey: field.fieldKey, value })
            .returning();
          if (!newAnswer) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to save answer");
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
    if (!ownedSubmission) throw serviceError("NOT_FOUND", "Submission not found");

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
    if (!ownedField) throw serviceError("NOT_FOUND", "Form field not found");

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

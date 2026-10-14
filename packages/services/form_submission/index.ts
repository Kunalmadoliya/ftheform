import { form, formSnapshot, submission } from "@repo/database/schema";
import { and, count, db, desc, eq } from "@repo/database";
import { z } from "zod";
import {
  validateSubmittedFormVersion,
  type validateSubmittedFormVersionType,
  startSubmissionFormSchema,
  type startSubmissionFormSchemaType,
  submissionLookupSchema,
  type submissionLookupSchemaType,
  activeSubmissionSchema,
  type activeSubmissionSchemaType,
  updateDraftAnswerSchema,
  type updateDraftAnswerSchemaType,
  updateLastActivitySchema,
  type updateLastActivitySchemaType,
  submitFormSchema,
  type submitFormSchemaType,
  listSubmissionsByFormSchema,
  type listSubmissionsByFormSchemaType,
  listSubmissionsByUserSchema,
  type listSubmissionsByUserSchemaType,
  markNotSubmittedSchema,
  type markNotSubmittedSchemaType,
  deleteSubmissionSchema,
  type deleteSubmissionSchemaType,
} from "./model";

export default class SubmissionService {
  private validateDraftAgainstSnapshot(fieldsJson: unknown, draftAnswer: unknown) {
    const parsedFields = z
      .array(z.object({ id: z.string(), required: z.boolean(), type: z.string() }))
      .safeParse(fieldsJson);
    if (!parsedFields.success) throw new Error("Form snapshot fields are invalid");
    const fields = parsedFields.data;
    const draft = draftAnswer && typeof draftAnswer === "object" && !Array.isArray(draftAnswer)
      ? draftAnswer as Record<string, unknown>
      : {};
    const fieldIds = new Set(fields.map((field) => field.id));

    if (Object.keys(draft).some((fieldId) => !fieldIds.has(fieldId))) {
      throw new Error("Draft contains an invalid field");
    }
    for (const field of fields) {
      const value = draft[field.id];
      const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
      if (field.required && empty) throw new Error(`Field ${field.id} is required`);
      if (field.required && field.type === "checkbox" && value !== true) {
        throw new Error(`Field ${field.id} must be checked`);
      }
    }
  }

  private async validateFormVersion(input: validateSubmittedFormVersionType) {
    const { formId } = await validateSubmittedFormVersion.parseAsync(input);

    const [validatedForm] = await db
      .select({
        currentVersion: form.currentVersion,
        isPublished: form.isPublished,
        isOpen: form.isOpen,
        responseLimit: form.responseLimit,
      })
      .from(form)
      .where(eq(form.id, formId));

    if (!validatedForm) {
      throw new Error("Form not found");
    }
    if (!validatedForm.isPublished) throw new Error("Form is not published");
    if (!validatedForm.isOpen) throw new Error("Form is closed");

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

    return { form: validatedForm, snapshot: matchingSnapshot };
  }

  public async startSubmissionForm(input: startSubmissionFormSchemaType) {
    const { formId, submissionId, userId } = await startSubmissionFormSchema.parseAsync(input);

    const { form, snapshot } = await this.validateFormVersion({ formId });

    if (submissionId) {
      const [existing] = await db
        .select()
        .from(submission)
        .where(and(eq(submission.id, submissionId), eq(submission.formId, formId)));
      if (!existing) throw new Error("Submission not found");
      if (existing.userId !== (userId ?? null)) throw new Error("Submission not found");
      return existing;
    }

    const [submittedResult] = await db
      .select({ submittedCount: count() })
      .from(submission)
      .where(and(eq(submission.formId, formId), eq(submission.status, "submitted")));
    if (!submittedResult) throw new Error("Unable to check the form response limit");
    if (submittedResult.submittedCount >= form.responseLimit) {
      throw new Error("This form has reached its response limit");
    }

    const [newSubmission] = await db
      .insert(submission)
      .values({
        formId,
        snapshotId: snapshot.id,
        userId: userId ?? null,
        status: "filling",
        submittedAt: null,
      })
      .returning();

    if (!newSubmission) {
      throw new Error("Failed to start submission");
    }

    return newSubmission;
  }

  public async startSubmission(input: startSubmissionFormSchemaType) {
    return this.startSubmissionForm(input);
  }

  public async getActiveSubmission(input: activeSubmissionSchemaType) {
    const { formId, submissionId, userId } = await activeSubmissionSchema.parseAsync(input);
    if (submissionId) return this.getSubmissionById({ submissionId, formId, userId });
    if (!userId) throw new Error("Submission id is required for anonymous submissions");
    const [activeSubmission] = await db
      .select()
      .from(submission)
      .where(and(eq(submission.formId, formId), eq(submission.userId, userId), eq(submission.status, "filling")))
      .orderBy(desc(submission.lastActivity));

    if (!activeSubmission) {
      throw new Error("Active submission not found");
    }

    return activeSubmission;
  }

  public async getSubmissionById(input: submissionLookupSchemaType) {
    const { submissionId, formId, userId } = await submissionLookupSchema.parseAsync(input);
    const [submissionRecord] = await db
      .select()
      .from(submission)
      .where(and(eq(submission.id, submissionId), formId ? eq(submission.formId, formId) : undefined));

    if (
      !submissionRecord ||
      (userId !== undefined && submissionRecord.userId !== (userId ?? null))
    ) {
      throw new Error("Submission not found");
    }
    return submissionRecord;
  }

  public async updateDraftAnswer(input: updateDraftAnswerSchemaType) {
    const { submissionId, draftAnswer, userId } = await updateDraftAnswerSchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId });
    if (existing.status !== "filling") throw new Error("Submission is already finalized");

    const currentDraft = existing.draftAnswer && typeof existing.draftAnswer === "object" && !Array.isArray(existing.draftAnswer)
      ? existing.draftAnswer as Record<string, unknown>
      : {};
    const [updatedSubmission] = await db
      .update(submission)
      .set({ draftAnswer: { ...currentDraft, ...draftAnswer }, lastActivity: new Date() })
      .where(and(eq(submission.id, submissionId), eq(submission.status, "filling")))
      .returning();
    if (!updatedSubmission) throw new Error("Submission not found");
    return updatedSubmission;
  }

  public async updateLastActivity(input: updateLastActivitySchemaType) {
    const { submissionId, userId } = await updateLastActivitySchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId });
    if (existing.status !== "filling") throw new Error("Submission is already finalized");
    const [updatedSubmission] = await db
      .update(submission)
      .set({ lastActivity: new Date() })
      .where(and(eq(submission.id, submissionId), eq(submission.status, "filling")))
      .returning();
    if (!updatedSubmission) throw new Error("Submission not found");
    return updatedSubmission;
  }

  public async submitForm(input: submitFormSchemaType) {
    const { submissionId, userId } = await submitFormSchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId });
    if (existing.status !== "filling") throw new Error("Submission is already finalized");

    const { form, snapshot } = await this.validateFormVersion({ formId: existing.formId });
    if (existing.snapshotId !== snapshot.id) throw new Error("Submission version is out of date");
    this.validateDraftAgainstSnapshot(snapshot.fieldsJson, existing.draftAnswer);

    const [submittedResult] = await db
      .select({ submittedCount: count() })
      .from(submission)
      .where(and(eq(submission.formId, existing.formId), eq(submission.status, "submitted")));
    if (!submittedResult) throw new Error("Unable to check the form response limit");
    if (submittedResult.submittedCount >= form.responseLimit) {
      throw new Error("This form has reached its response limit");
    }

    const [updatedSubmission] = await db
      .update(submission)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        lastActivity: new Date(),
      })
      .where(and(eq(submission.id, submissionId), eq(submission.status, "filling"), eq(submission.formId, existing.formId)))
      .returning();

    if (!updatedSubmission) {
      throw new Error("Failed to submit form");
    }

    return updatedSubmission;
  }

  public async listSubmissionsByForm(input: listSubmissionsByFormSchemaType) {
    const { formId, userId } = await listSubmissionsByFormSchema.parseAsync(input);
    const [ownedForm] = await db.select({ id: form.id }).from(form).where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw new Error("Form not found");
    return db
      .select()
      .from(submission)
      .where(and(eq(submission.formId, formId), eq(submission.status, "submitted")))
      .orderBy(desc(submission.startedAt));
  }

  public async listSubmissionsByUser(input: listSubmissionsByUserSchemaType) {
    const { userId } = await listSubmissionsByUserSchema.parseAsync(input);
    return db.select().from(submission).where(eq(submission.userId, userId)).orderBy(desc(submission.startedAt));
  }

  public async checkVersionMismatch(input: validateSubmittedFormVersionType) {
    const { formId, submissionId } = await validateSubmittedFormVersion.parseAsync(input);
    const { snapshot } = await this.validateFormVersion({ formId });
    if (!submissionId) return false;
    const current = await this.getSubmissionById({ submissionId, formId });
    return current.snapshotId !== snapshot.id;
  }

  public async markNotSubmitted(input: markNotSubmittedSchemaType) {
    const { submissionId, userId } = await markNotSubmittedSchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId });
    if (existing.status !== "filling") return existing;

    const [updatedSubmission] = await db
      .update(submission)
      .set({ status: "not_submitted", lastActivity: new Date() })
      .where(and(eq(submission.id, submissionId), eq(submission.status, "filling")))
      .returning();
    if (!updatedSubmission) throw new Error("Failed to mark submission as not submitted");
    return updatedSubmission;
  }

  public async deleteSubmission(input: deleteSubmissionSchemaType) {
    const { submissionId, userId } = await deleteSubmissionSchema.parseAsync(input);
    const [existingSubmission] = await db
      .select({ userId: submission.userId, formOwnerId: form.userId })
      .from(submission)
      .innerJoin(form, eq(submission.formId, form.id))
      .where(eq(submission.id, submissionId))
      .limit(1);
    if (
      !existingSubmission ||
      (existingSubmission.userId !== userId && existingSubmission.formOwnerId !== userId)
    ) {
      throw new Error("Submission not found");
    }
    const [deletedSubmission] = await db
      .delete(submission)
      .where(eq(submission.id, submissionId))
      .returning({ id: submission.id });
    if (!deletedSubmission) throw new Error("Submission not found");
    return deletedSubmission;
  }
}

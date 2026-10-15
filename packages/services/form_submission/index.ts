import { answer, form, formField, formSnapshot, submission } from "@repo/database/schema";
import { and, count, db, desc, eq, isNull, lt, or, sql } from "@repo/database";
import { randomUUID } from "node:crypto";
import { assertFormAccess } from "../form/access";
import { migrateDraftAnswers } from "../form/snapshot-utils";
import { validateSnapshotDraft } from "./draft-validation";
import { serviceError } from "../errors";
import { deriveFormLifecycle } from "../form/model";
import { buildSubmissionAnswerRows } from "./answer-rows";
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
  private respondentCondition(userId: string | null | undefined, respondentId: string | null | undefined) {
    if (userId && respondentId) {
      return or(
        eq(submission.userId, userId),
        and(isNull(submission.userId), eq(submission.respondentId, respondentId)),
      );
    }
    if (userId) return eq(submission.userId, userId);
    if (respondentId) {
      return and(isNull(submission.userId), eq(submission.respondentId, respondentId));
    }
    throw serviceError("UNAUTHORIZED", "A valid respondent identity is required");
  }

  private assertPublicFormAvailable(isPublished: boolean, isArchived: boolean, ownerId: string | null) {
    if (!ownerId || deriveFormLifecycle(isPublished, isArchived) === "archived") {
      throw serviceError("NOT_FOUND", "Form no longer available");
    }
  }

  private async lockSubmissionIdentities(
    tx: Pick<typeof db, "execute">,
    keys: string[],
  ) {
    for (const key of [...new Set(keys)].sort()) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    }
  }

  private async migrateSubmissionToSnapshot(
    tx: Pick<typeof db, "select" | "update">,
    currentSubmission: typeof submission.$inferSelect,
    snapshot: typeof formSnapshot.$inferSelect,
  ) {
    if (currentSubmission.snapshotId === snapshot.id) return currentSubmission;

    const [oldSnapshot] = await tx
      .select({ fieldsJson: formSnapshot.fieldsJson })
      .from(formSnapshot)
      .where(eq(formSnapshot.id, currentSubmission.snapshotId));
    const migratedDraft = migrateDraftAnswers(
      oldSnapshot?.fieldsJson,
      snapshot.fieldsJson,
      currentSubmission.draftAnswer,
    );
    const [migratedSubmission] = await tx
      .update(submission)
      .set({ snapshotId: snapshot.id, draftAnswer: migratedDraft, lastActivity: new Date() })
      .where(and(eq(submission.id, currentSubmission.id), eq(submission.status, "filling")))
      .returning();
    if (!migratedSubmission) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to migrate the active response");
    return migratedSubmission;
  }

  private async ensureSubmissionRespondentId(
    tx: Pick<typeof db, "update">,
    currentSubmission: typeof submission.$inferSelect,
    respondentId: string,
  ) {
    if (currentSubmission.respondentId) return currentSubmission;
    const [updatedSubmission] = await tx
      .update(submission)
      .set({ respondentId })
      .where(and(eq(submission.id, currentSubmission.id), eq(submission.status, "filling")))
      .returning();
    if (!updatedSubmission) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to set the response identity");
    return updatedSubmission;
  }

  private async validateFormVersion(input: validateSubmittedFormVersionType) {
    const { formId, userId } = await validateSubmittedFormVersion.parseAsync(input);

    const [validatedForm] = await db
      .select({
        currentVersion: form.currentVersion,
        ownerId: form.userId,
        isPublished: form.isPublished,
        isOpen: form.isOpen,
        isArchived: form.isArchived,
        responseLimit: form.responseLimit,
        accessPolicy: form.accessPolicy,
        allowMultipleSubmissions: form.allowMultipleSubmissions,
      })
      .from(form)
      .where(eq(form.id, formId))
      .for("share");

    if (!validatedForm) throw serviceError("NOT_FOUND", "Form no longer available");
    this.assertPublicFormAvailable(validatedForm.isPublished, validatedForm.isArchived, validatedForm.ownerId);
    if (!validatedForm.isPublished) throw serviceError("FORBIDDEN", "Form is not published");
    if (!validatedForm.isOpen) throw serviceError("FORBIDDEN", "Form is closed");
    assertFormAccess(validatedForm.accessPolicy, userId);

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
      throw serviceError("NOT_FOUND", "Form snapshot not found");
    }

    return { form: validatedForm, snapshot: matchingSnapshot };
  }

  public async startSubmissionForm(input: startSubmissionFormSchemaType) {
    const { formId, userId, respondentId: cookieRespondentId } =
      await startSubmissionFormSchema.parseAsync(input);
    const { form: formSettings } = await this.validateFormVersion({ formId, userId });

    const respondentId = cookieRespondentId ?? randomUUID();
    const identityKeys = userId
      ? [
          `submission:${formId}:user:${userId}`,
          ...(respondentId ? [`submission:${formId}:respondent:${respondentId}`] : []),
        ]
      : [`submission:${formId}:respondent:${respondentId}`];

    const result = await db.transaction(async (tx) => {
      const [currentForm] = await tx
        .select({
          currentVersion: form.currentVersion,
          ownerId: form.userId,
          isPublished: form.isPublished,
          isOpen: form.isOpen,
          isArchived: form.isArchived,
          responseLimit: form.responseLimit,
          accessPolicy: form.accessPolicy,
          allowMultipleSubmissions: form.allowMultipleSubmissions,
        })
        .from(form)
        .where(eq(form.id, formId))
        .for("share");
      if (!currentForm) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(currentForm.isPublished, currentForm.isArchived, currentForm.ownerId);
      await this.lockSubmissionIdentities(tx, identityKeys);
      if (!currentForm.isPublished) throw serviceError("FORBIDDEN", "Form is not published");
      if (!currentForm.isOpen) throw serviceError("FORBIDDEN", "Form is closed");
      assertFormAccess(currentForm.accessPolicy, userId);

      const [snapshot] = await tx
        .select()
        .from(formSnapshot)
        .where(and(eq(formSnapshot.formId, formId), eq(formSnapshot.versions, currentForm.currentVersion)))
        .orderBy(desc(formSnapshot.createdAt))
        .limit(1);
      if (!snapshot) throw serviceError("NOT_FOUND", "Form snapshot not found");

      const identityFilters = [
        ...(userId ? [eq(submission.userId, userId)] : []),
        eq(submission.respondentId, respondentId),
      ];

      if (!currentForm.allowMultipleSubmissions) {
        const [previouslySubmitted] = await tx
          .select({
            submittedAt: submission.submittedAt,
            respondentId: submission.respondentId,
          })
          .from(submission)
          .where(and(
            eq(submission.formId, formId),
            eq(submission.status, "submitted"),
            or(...identityFilters),
          ))
          .orderBy(desc(submission.submittedAt))
          .limit(1);
        if (previouslySubmitted) {
          return {
            outcome: "already_submitted" as const,
            formId,
            submittedAt: previouslySubmitted.submittedAt,
            respondentId: previouslySubmitted.respondentId,
          };
        }
      }

      const activeIdentity = userId
        ? eq(submission.userId, userId)
        : and(isNull(submission.userId), eq(submission.respondentId, respondentId!));
      const [activeSubmission] = await tx
        .select()
        .from(submission)
        .where(and(eq(submission.formId, formId), eq(submission.status, "filling"), activeIdentity))
        .orderBy(desc(submission.lastActivity))
        .limit(1);
      if (activeSubmission) {
        const migratedSubmission = await this.migrateSubmissionToSnapshot(tx, activeSubmission, snapshot);
        const identifiedSubmission = await this.ensureSubmissionRespondentId(
          tx,
          migratedSubmission,
          respondentId,
        );
        return { outcome: "started" as const, submission: identifiedSubmission };
      }

      if (userId && respondentId && currentForm.accessPolicy !== "anonymous_only") {
        const [anonymousDraft] = await tx
          .select()
          .from(submission)
          .where(
            and(
              eq(submission.formId, formId),
              eq(submission.status, "filling"),
              isNull(submission.userId),
              eq(submission.respondentId, respondentId),
            ),
          )
          .orderBy(desc(submission.lastActivity))
          .limit(1);
        if (anonymousDraft) {
          const migratedDraft = await this.migrateSubmissionToSnapshot(tx, anonymousDraft, snapshot);
          const [adoptedDraft] = await tx
            .update(submission)
            .set({ userId, respondentId, lastActivity: new Date() })
            .where(and(eq(submission.id, migratedDraft.id), eq(submission.status, "filling")))
            .returning();
          if (!adoptedDraft) throw serviceError("CONFLICT", "Unable to resume the anonymous response");
          return { outcome: "started" as const, submission: adoptedDraft };
        }
      }

      const [submittedResult] = await tx
        .select({ submittedCount: count() })
        .from(submission)
        .where(and(eq(submission.formId, formId), eq(submission.status, "submitted")));
      if (!submittedResult) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form response limit");
      if (submittedResult.submittedCount >= currentForm.responseLimit) {
        throw serviceError("TOO_MANY_REQUESTS", "This form has reached its response limit");
      }

      const [newSubmission] = await tx
        .insert(submission)
        .values({
          formId,
          snapshotId: snapshot.id,
          userId: userId ?? null,
          respondentId,
          status: "filling",
          submittedAt: null,
        })
        .returning();
      if (!newSubmission) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to start submission");
      return { outcome: "started" as const, submission: newSubmission };
    });

    return {
      ...result,
      respondentIdToSet: cookieRespondentId
        ? null
        : result.outcome === "started"
          ? result.submission.respondentId
          : result.respondentId,
    };
  }

  public async startSubmission(input: startSubmissionFormSchemaType) {
    return this.startSubmissionForm(input);
  }

  public async getActiveSubmission(input: activeSubmissionSchemaType) {
    const { formId, submissionId, userId, respondentId } = await activeSubmissionSchema.parseAsync(input);
    if (submissionId) return this.getSubmissionById({ submissionId, formId, userId, respondentId });
    return db.transaction(async (tx) => {
      const [formAccess] = await tx
        .select({
          accessPolicy: form.accessPolicy,
          ownerId: form.userId,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, formId))
        .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);
      assertFormAccess(formAccess.accessPolicy, userId);
      const [activeSubmission] = await tx
        .select()
        .from(submission)
        .where(and(
          eq(submission.formId, formId),
          eq(submission.status, "filling"),
          this.respondentCondition(userId, respondentId),
        ))
        .orderBy(desc(submission.lastActivity));

      if (!activeSubmission) throw serviceError("NOT_FOUND", "Active submission not found");
      return activeSubmission;
    });
  }

  public async getSubmissionById(input: submissionLookupSchemaType) {
    const { submissionId, formId, userId, respondentId } = await submissionLookupSchema.parseAsync(input);
    const [submissionReference] = await db
      .select({ formId: submission.formId })
      .from(submission)
      .where(and(
        eq(submission.id, submissionId),
        formId ? eq(submission.formId, formId) : undefined,
        this.respondentCondition(userId, respondentId),
      ))
      .limit(1);
    if (!submissionReference) throw serviceError("NOT_FOUND", "Form no longer available");

    return db.transaction(async (tx) => {
      const [formAccess] = await tx
      .select({
        accessPolicy: form.accessPolicy,
        ownerId: form.userId,
        isPublished: form.isPublished,
        isArchived: form.isArchived,
      })
      .from(form)
      .where(eq(form.id, submissionReference.formId))
      .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);
      assertFormAccess(formAccess.accessPolicy, userId);

      const [submissionRecord] = await tx
      .select()
      .from(submission)
      .where(and(
        eq(submission.id, submissionId),
        eq(submission.formId, submissionReference.formId),
        this.respondentCondition(userId, respondentId),
      ))
      .limit(1);
      if (!submissionRecord) throw serviceError("NOT_FOUND", "Form no longer available");
      return submissionRecord;
    });
  }

  public async updateDraftAnswer(input: updateDraftAnswerSchemaType) {
    const { submissionId, draftAnswer, userId, respondentId } = await updateDraftAnswerSchema.parseAsync(input);
    const [submissionReference] = await db
      .select({ formId: submission.formId })
      .from(submission)
      .where(and(eq(submission.id, submissionId), this.respondentCondition(userId, respondentId)))
      .limit(1);
    if (!submissionReference) throw serviceError("NOT_FOUND", "Form no longer available");

    return db.transaction(async (tx) => {
      const [formAccess] = await tx
        .select({
          accessPolicy: form.accessPolicy,
          ownerId: form.userId,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, submissionReference.formId))
        .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);
      assertFormAccess(formAccess.accessPolicy, userId);

      const [existing] = await tx
        .select({
          submissionRecord: submission,
        })
        .from(submission)
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.formId, submissionReference.formId),
          this.respondentCondition(userId, respondentId),
        ))
        .limit(1)
        .for("update");
      if (!existing) throw serviceError("NOT_FOUND", "Form no longer available");
      if (existing.submissionRecord.status !== "filling") {
        throw serviceError("CONFLICT", "Submission is already finalized");
      }

      const [snapshot] = await tx
        .select()
        .from(formSnapshot)
        .where(eq(formSnapshot.id, existing.submissionRecord.snapshotId))
        .limit(1);
      if (!snapshot) throw serviceError("NOT_FOUND", "Form snapshot not found");
      const currentDraft = existing.submissionRecord.draftAnswer &&
        typeof existing.submissionRecord.draftAnswer === "object" &&
        !Array.isArray(existing.submissionRecord.draftAnswer)
        ? existing.submissionRecord.draftAnswer as Record<string, unknown>
        : {};
      const validatedDraft = validateSnapshotDraft(
        snapshot.fieldsJson,
        { ...currentDraft, ...draftAnswer },
        { requireRequired: false },
      );
      const [updatedSubmission] = await tx
        .update(submission)
        .set({ draftAnswer: validatedDraft.draft, lastActivity: new Date() })
        .where(and(eq(submission.id, submissionId), eq(submission.status, "filling")))
        .returning();
      if (!updatedSubmission) throw serviceError("NOT_FOUND", "Submission not found");
      return updatedSubmission;
    });
  }

  public async updateLastActivity(input: updateLastActivitySchemaType) {
    const { submissionId, userId, respondentId } = await updateLastActivitySchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId, respondentId });
    if (existing.status !== "filling") throw serviceError("CONFLICT", "Submission is already finalized");
    return db.transaction(async (tx) => {
      const [formAccess] = await tx
        .select({
          ownerId: form.userId,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, existing.formId))
        .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);
      const [updatedSubmission] = await tx
        .update(submission)
        .set({ lastActivity: new Date() })
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.status, "filling"),
          this.respondentCondition(userId, respondentId),
        ))
        .returning();
      if (!updatedSubmission) throw serviceError("NOT_FOUND", "Submission not found");
      return updatedSubmission;
    });
  }

  public async submitForm(input: submitFormSchemaType) {
    const { submissionId, userId, respondentId } = await submitFormSchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId, respondentId });
    const identities = userId
      ? [
          `submission:${existing.formId}:user:${userId}`,
          ...(respondentId ? [`submission:${existing.formId}:respondent:${respondentId}`] : []),
        ]
      : [`submission:${existing.formId}:respondent:${respondentId}`];

    return db.transaction(async (tx) => {
      const [formSettings] = await tx
        .select({
          currentVersion: form.currentVersion,
          ownerId: form.userId,
          isPublished: form.isPublished,
          isOpen: form.isOpen,
          isArchived: form.isArchived,
          responseLimit: form.responseLimit,
          accessPolicy: form.accessPolicy,
          allowMultipleSubmissions: form.allowMultipleSubmissions,
        })
        .from(form)
        .where(eq(form.id, existing.formId))
        .for("share");
      if (!formSettings) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formSettings.isPublished, formSettings.isArchived, formSettings.ownerId);
      await this.lockSubmissionIdentities(tx, [
        ...identities,
        `submission-form-limit:${existing.formId}`,
      ]);

      const [currentSubmission] = await tx
        .select()
        .from(submission)
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.formId, existing.formId),
          this.respondentCondition(userId, respondentId),
        ))
        .for("update");
      if (!currentSubmission) throw serviceError("NOT_FOUND", "Submission not found");
      if (currentSubmission.status === "submitted") return currentSubmission;
      if (currentSubmission.status !== "filling") throw serviceError("CONFLICT", "Submission is already finalized");
      if (!formSettings.isPublished) throw serviceError("FORBIDDEN", "Form is not published");
      if (!formSettings.isOpen) throw serviceError("FORBIDDEN", "Form is closed");
      assertFormAccess(formSettings.accessPolicy, userId);

      const [snapshot] = await tx
        .select()
        .from(formSnapshot)
        .where(and(
          eq(formSnapshot.formId, existing.formId),
          eq(formSnapshot.versions, formSettings.currentVersion),
        ))
        .orderBy(desc(formSnapshot.createdAt))
        .limit(1);
      if (!snapshot) throw serviceError("NOT_FOUND", "Form snapshot not found");
      if (currentSubmission.snapshotId !== snapshot.id) {
        throw serviceError("CONFLICT", "Submission version is out of date");
      }
      const validatedDraft = validateSnapshotDraft(
        snapshot.fieldsJson,
        currentSubmission.draftAnswer,
        { requireRequired: true },
      );

      if (!formSettings.allowMultipleSubmissions) {
        const identityFilters = [
          ...(userId ? [eq(submission.userId, userId)] : []),
          ...(respondentId ? [eq(submission.respondentId, respondentId)] : []),
        ];
        const [priorSubmission] = await tx
          .select()
          .from(submission)
          .where(and(
            eq(submission.formId, existing.formId),
            eq(submission.status, "submitted"),
            or(...identityFilters),
          ))
          .limit(1);
        if (priorSubmission) return priorSubmission;
      }

      const [submittedResult] = await tx
        .select({ submittedCount: count() })
        .from(submission)
        .where(and(eq(submission.formId, existing.formId), eq(submission.status, "submitted")));
      if (!submittedResult) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form response limit");
      if (submittedResult.submittedCount >= formSettings.responseLimit) {
        throw serviceError("TOO_MANY_REQUESTS", "This form has reached its response limit");
      }

      const currentFields = await tx
        .select({ id: formField.id, fieldKey: formField.fieldKey })
        .from(formField)
        .where(eq(formField.formId, existing.formId));
      const answerRows = buildSubmissionAnswerRows(
        validatedDraft.fields,
        validatedDraft.draft,
        currentFields,
      );
      for (const row of answerRows) {
        const [existingAnswer] = await tx
          .select({ id: answer.id })
          .from(answer)
          .where(and(
            eq(answer.submissionId, submissionId),
            eq(answer.fieldKey, row.fieldKey),
          ))
          .limit(1)
          .for("update");
        if (existingAnswer) {
          const [updatedAnswer] = await tx
            .update(answer)
            .set({ fieldId: row.fieldId, value: row.value })
            .where(eq(answer.id, existingAnswer.id))
            .returning({ id: answer.id });
          if (!updatedAnswer) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to update answer");
        } else {
          const [createdAnswer] = await tx
            .insert(answer)
            .values({
              submissionId,
              fieldKey: row.fieldKey,
              fieldId: row.fieldId,
              value: row.value,
            })
            .returning({ id: answer.id });
          if (!createdAnswer) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to save answer");
        }
      }

      const [updatedSubmission] = await tx
        .update(submission)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          lastActivity: new Date(),
        })
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.status, "filling"),
          eq(submission.formId, existing.formId),
          this.respondentCondition(userId, respondentId),
        ))
        .returning();
      if (!updatedSubmission) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to submit form");
      return updatedSubmission;
    });
  }

  public async listSubmissionsByForm(input: listSubmissionsByFormSchemaType) {
    const { formId, userId } = await listSubmissionsByFormSchema.parseAsync(input);
    const [ownedForm] = await db.select({ id: form.id }).from(form).where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
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
    const { formId, submissionId, userId, respondentId } =
      await validateSubmittedFormVersion.parseAsync(input);
    const { snapshot } = await this.validateFormVersion({ formId, userId, respondentId });
    if (!submissionId) return false;
    const current = await this.getSubmissionById({ submissionId, formId, userId, respondentId });
    return current.snapshotId !== snapshot.id;
  }

  public async markNotSubmitted(input: markNotSubmittedSchemaType) {
    const { submissionId, userId, respondentId } = await markNotSubmittedSchema.parseAsync(input);
    const existing = await this.getSubmissionById({ submissionId, userId, respondentId });
    if (existing.status !== "filling") return existing;

    return db.transaction(async (tx) => {
      const [formAccess] = await tx
        .select({
          ownerId: form.userId,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, existing.formId))
        .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);
      const [updatedSubmission] = await tx
        .update(submission)
        .set({ status: "not_submitted", lastActivity: new Date() })
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.status, "filling"),
          this.respondentCondition(userId, respondentId),
        ))
        .returning();
      if (!updatedSubmission) throw serviceError("CONFLICT", "Submission is already finalized");
      return updatedSubmission;
    });
  }

  public async markInactiveSubmissionsNotSubmitted() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expired = await db
      .update(submission)
      .set({ status: "not_submitted" })
      .where(and(eq(submission.status, "filling"), lt(submission.lastActivity, cutoff)))
      .returning({ id: submission.id });
    return { count: expired.length };
  }

  public async deleteSubmission(input: deleteSubmissionSchemaType) {
    const { submissionId, userId, respondentId } = await deleteSubmissionSchema.parseAsync(input);
    if (!userId && !respondentId) {
      throw serviceError("UNAUTHORIZED", "A valid respondent identity is required");
    }
    const [submissionReference] = await db
      .select({ formId: submission.formId })
      .from(submission)
      .where(eq(submission.id, submissionId))
      .limit(1);
    if (!submissionReference) throw serviceError("NOT_FOUND", "Form no longer available");

    return db.transaction(async (tx) => {
      const [formAccess] = await tx
        .select({
          ownerId: form.userId,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, submissionReference.formId))
        .for("share");
      if (!formAccess) throw serviceError("NOT_FOUND", "Form no longer available");
      this.assertPublicFormAvailable(formAccess.isPublished, formAccess.isArchived, formAccess.ownerId);

      const [existingSubmission] = await tx
        .select({
          userId: submission.userId,
          respondentId: submission.respondentId,
          status: submission.status,
          formOwnerId: form.userId,
        })
        .from(submission)
        .innerJoin(form, eq(submission.formId, form.id))
        .where(and(
          eq(submission.id, submissionId),
          eq(submission.formId, submissionReference.formId),
        ))
        .for("update");
      const isRespondent =
        Boolean(userId && existingSubmission?.userId === userId) ||
        Boolean(respondentId && existingSubmission?.respondentId === respondentId);
      const isOwner = Boolean(userId && existingSubmission?.formOwnerId === userId);
      const mayDeleteDraft = isRespondent && existingSubmission?.status === "filling";
      const mayDeleteSubmitted = isOwner && existingSubmission?.status === "submitted";
      if (!existingSubmission || (!mayDeleteDraft && !mayDeleteSubmitted)) {
        throw serviceError("NOT_FOUND", "Submission not found");
      }

      const [deletedSubmission] = await tx
        .delete(submission)
        .where(eq(submission.id, submissionId))
        .returning({ id: submission.id });
      if (!deletedSubmission) throw serviceError("NOT_FOUND", "Submission not found");
      return deletedSubmission;
    });
  }
}

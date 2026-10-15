import { and, count, db, desc, eq, inArray, isNotNull, or, sql } from "@repo/database";
import { user } from "@repo/database/auth-schema";
import {
  createInitialForm,
  deleteForm,
  deriveFormLifecycle,
  type CreateInitialFormType,
  type DeleteFormType,
  getFormDeletionPreview,
  getFormById,
  type GetFormByIdType,
  getPublicFormById,
  type GetPublicFormByIdType,
  listFormsByLifecycle,
  type ListFormsByLifecycleType,
  listFormsByUser,
  type ListFormsByUserType,
  requireDeleteConfirmation,
  archiveForm,
  restoreForm,
  renameForm,
  type RenameFormType,
  updateFormDescription,
  type UpdateFormDescriptionType,
  updateFormSettings,
  type UpdateFormSettingsType,
  toggleFormOpen,
  type ToggleFormOpenStatusType,
  type UpdateFormResponseLimitType,
  updateFormResponseLimit,
  incrementFormViewCount,
  type IncrementFormViewCountType,
  publishForm,
  type PublishFormType,
  unpublishForm,
  type UnpublishFormType,
} from "./model";
import { answer, form, formField, formSnapshot, formView, submission } from "@repo/database/models/form-schema";
import { env } from "../env";
import FormSnapshotService from "../form_snapshot";
import { assertFormAccess } from "./access";
import { fieldSetHash } from "./snapshot-utils";
import { slugifyFormTitle } from "./slug-utils";
import { serviceError } from "../errors";
import { buildFormCsv } from "./csv";

const formSnapshotService = new FormSnapshotService();

export default class FormService {
  private formSelection() {
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      formUrl: sql<string>`${env.WEB_URL.replace(/\/+$/, "")} || '/form/' || ${form.formUrl}`,
      isPublished: form.isPublished,
      isOpen: form.isOpen,
      responseLimit: form.responseLimit,
      accessPolicy: form.accessPolicy,
      allowMultipleSubmissions: form.allowMultipleSubmissions,
      isArchived: form.isArchived,
      views: form.views,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }

  public async createInitialForm(input: CreateInitialFormType) {
    const { title, description, userId } = await createInitialForm.parseAsync(input);

    const [newForm] = await db
      .insert(form)
      .values({
        title,
        description,
        userId,
      })
      .returning(this.formSelection());

    if (!newForm) {
      throw serviceError("INTERNAL_SERVER_ERROR", "Form creation failed");
    }

    return newForm;
  }

  public async getFormById(input: GetFormByIdType) {
    const { formId, userId } = await getFormById.parseAsync(input);

    const [foundForm] = await db
      .select({ ...this.formSelection(), currentVersion: form.currentVersion })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!foundForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    let hasUnpublishedChanges = false;
    if (foundForm.isPublished) {
      const [currentSnapshot] = await db
        .select({ fieldsJson: formSnapshot.fieldsJson })
        .from(formSnapshot)
        .where(and(
          eq(formSnapshot.formId, formId),
          eq(formSnapshot.versions, foundForm.currentVersion),
        ))
        .orderBy(desc(formSnapshot.createdAt))
        .limit(1);
      const currentFields = await db
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(formField.fieldOrder);
      hasUnpublishedChanges = !currentSnapshot ||
        fieldSetHash(currentFields) !== fieldSetHash(currentSnapshot.fieldsJson);
    }
    const { currentVersion: _currentVersion, ...ownedForm } = foundForm;
    return { ...ownedForm, hasUnpublishedChanges };
  }

  public async getPublicFormById(input: GetPublicFormByIdType, userId?: string | null) {
    const { formId } = await getPublicFormById.parseAsync(input);
    const [foundForm] = await db
      .select({ ...this.formSelection(), ownerId: form.userId })
      .from(form)
      .where(and(
        eq(form.id, formId),
        isNotNull(form.userId),
        or(eq(form.isPublished, true), userId ? eq(form.userId, userId) : undefined),
      ));

    if (!foundForm) throw serviceError("NOT_FOUND", "Form no longer available");
    if (deriveFormLifecycle(foundForm.isPublished, foundForm.isArchived) === "archived") {
      throw serviceError("NOT_FOUND", "Form no longer available");
    }
    const isOwner = Boolean(userId && foundForm.ownerId === userId);
    if (!isOwner) assertFormAccess(foundForm.accessPolicy, userId);
    let submittedResponseCount = 0;
    if (foundForm.isPublished && foundForm.isOpen) {
      const [submittedResponses] = await db
        .select({ count: count() })
        .from(submission)
        .where(and(eq(submission.formId, formId), eq(submission.status, "submitted")));
      if (!submittedResponses) {
        throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form response limit");
      }
      submittedResponseCount = submittedResponses.count;
    }
    const { ownerId: _ownerId, ...publicForm } = foundForm;
    return {
      ...publicForm,
      isOwner,
      acceptingResponses:
        foundForm.isPublished &&
        foundForm.isOpen &&
        submittedResponseCount < foundForm.responseLimit,
    };
  }

  public async renameForm(input: RenameFormType) {
    const { formId, title, userId } = await renameForm.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ title })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
  }

  public async updateFormDescription(input: UpdateFormDescriptionType) {
    const { formId, description, userId } = await updateFormDescription.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ description })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
  }

  public async updateSettings(input: UpdateFormSettingsType) {
    const { formId, accessPolicy, allowMultipleSubmissions, userId } =
      await updateFormSettings.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ accessPolicy, allowMultipleSubmissions })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning(this.formSelection());

    if (!updatedForm) throw serviceError("NOT_FOUND", "Form not found");
    return updatedForm;
  }

  public async deleteForm(input: DeleteFormType) {
    const { formId, userId, confirmDeleteResponses, expectedSubmittedCount } =
      await deleteForm.parseAsync(input);

    return db.transaction(async (tx) => {
      const [ownedForm] = await tx
        .select({ id: form.id })
        .from(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .for("update");
      if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");

      const [counts] = await tx
        .select({ submittedCount: count() })
        .from(submission)
        .where(and(
          eq(submission.formId, formId),
          eq(submission.status, "submitted"),
        ));
      if (!counts) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to count form responses");
      requireDeleteConfirmation(
        counts.submittedCount,
        confirmDeleteResponses,
        expectedSubmittedCount,
      );

      await tx.delete(submission).where(eq(submission.formId, formId));
      await tx.delete(formSnapshot).where(eq(formSnapshot.formId, formId));
      const [deletedForm] = await tx
        .delete(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .returning({ id: form.id });
      if (!deletedForm) throw serviceError("NOT_FOUND", "Form not found");
      return deletedForm;
    });
  }

  public async listFormsByUser(input: ListFormsByUserType) {
    const { userId } = await listFormsByUser.parseAsync(input);

    return db
      .select(this.formSelection())
      .from(form)
      .where(eq(form.userId, userId))
      .orderBy(desc(form.createdAt));
  }

  public async archiveForm(input: { formId: string; userId: string }) {
    const { formId, userId } = await archiveForm.parseAsync(input);
    return db.transaction(async (tx) => {
      const [ownedForm] = await tx
        .select({ id: form.id, isArchived: form.isArchived })
        .from(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .for("update");
      if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
      if (deriveFormLifecycle(false, ownedForm.isArchived) === "archived") {
        throw serviceError("CONFLICT", "Form is already archived");
      }

      const [archivedForm] = await tx
        .update(form)
        .set({ isArchived: true })
        .where(eq(form.id, formId))
        .returning(this.formSelection());
      if (!archivedForm) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to archive form");
      return { ...archivedForm, lifecycle: deriveFormLifecycle(archivedForm.isPublished, true) };
    });
  }

  public async restoreForm(input: { formId: string; userId: string }) {
    const { formId, userId } = await restoreForm.parseAsync(input);
    return db.transaction(async (tx) => {
      const [ownedForm] = await tx
        .select({ id: form.id, isArchived: form.isArchived })
        .from(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .for("update");
      if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
      if (deriveFormLifecycle(false, ownedForm.isArchived) !== "archived") {
        throw serviceError("CONFLICT", "Form is not archived");
      }

      const [restoredForm] = await tx
        .update(form)
        .set({ isArchived: false })
        .where(eq(form.id, formId))
        .returning(this.formSelection());
      if (!restoredForm) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to restore form");
      return { ...restoredForm, lifecycle: deriveFormLifecycle(restoredForm.isPublished, false) };
    });
  }

  public async getFormDeletionPreview(input: { formId: string; userId: string }) {
    const { formId, userId } = await getFormDeletionPreview.parseAsync(input);
    const [ownedForm] = await db
      .select({ isPublished: form.isPublished, isArchived: form.isArchived })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");

    const counts = await db
      .select({ status: submission.status, count: count() })
      .from(submission)
      .where(eq(submission.formId, formId))
      .groupBy(submission.status);
    return {
      submittedCount: counts.find(({ status }) => status === "submitted")?.count ?? 0,
      inProgressCount: counts.find(({ status }) => status === "filling")?.count ?? 0,
      isPublished: ownedForm.isPublished,
      isArchived: ownedForm.isArchived,
    };
  }

  public async listFormsByLifecycle(input: ListFormsByLifecycleType) {
    const { userId, lifecycle } = await listFormsByLifecycle.parseAsync(input);
    const ownedForms = await db
      .select(this.formSelection())
      .from(form)
      .where(eq(form.userId, userId))
      .orderBy(desc(form.createdAt));

    const counts = { live: 0, draft: 0, archived: 0 };
    const formsWithLifecycle = ownedForms.map((ownedForm) => {
      const formLifecycle = deriveFormLifecycle(ownedForm.isPublished, ownedForm.isArchived);
      counts[formLifecycle] += 1;
      return { ...ownedForm, lifecycle: formLifecycle };
    });
    const selectedForms = formsWithLifecycle.filter(({ lifecycle: formLifecycle }) => formLifecycle === lifecycle);
    const submittedCounts = selectedForms.length === 0
      ? []
      : await db
          .select({ formId: submission.formId, count: count() })
          .from(submission)
          .where(and(
            inArray(submission.formId, selectedForms.map(({ id }) => id)),
            eq(submission.status, "submitted"),
          ))
          .groupBy(submission.formId);
    const submittedByFormId = new Map(
      submittedCounts.map(({ formId, count: submittedCount }) => [formId, submittedCount]),
    );

    return {
      forms: selectedForms.map((ownedForm) => ({
        ...ownedForm,
        submittedCount: submittedByFormId.get(ownedForm.id) ?? 0,
      })),
      counts,
    };
  }

  public async exportFormCsv(input: { formId: string; userId: string }) {
    const { formId, userId } = await getFormDeletionPreview.parseAsync(input);
    const [ownedForm] = await db
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");

    const snapshots = await db
      .select({
        versions: formSnapshot.versions,
        createdAt: formSnapshot.createdAt,
        fieldsJson: formSnapshot.fieldsJson,
      })
      .from(formSnapshot)
      .where(eq(formSnapshot.formId, formId));
    const submitted = await db
      .select({
        id: submission.id,
        submittedAt: submission.submittedAt,
        versions: formSnapshot.versions,
        respondentName: user.name,
        respondentEmail: user.email,
      })
      .from(submission)
      .innerJoin(formSnapshot, eq(submission.snapshotId, formSnapshot.id))
      .leftJoin(user, eq(submission.userId, user.id))
      .where(and(
        eq(submission.formId, formId),
        eq(submission.status, "submitted"),
      ))
      .orderBy(desc(submission.submittedAt));
    const answers = submitted.length === 0
      ? []
      : await db
          .select({
            submissionId: answer.submissionId,
            fieldKey: answer.fieldKey,
            value: answer.value,
          })
          .from(answer)
          .where(inArray(answer.submissionId, submitted.map(({ id }) => id)));
    return buildFormCsv(snapshots, submitted, answers);
  }

  public async toggleFormOpen(input: ToggleFormOpenStatusType) {
    const { formId, userId, isOpen } = await toggleFormOpen.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ isOpen })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
  }

  public async toggleFormOpenStatus(input: ToggleFormOpenStatusType) {
    return this.toggleFormOpen(input);
  }

  public async updateResponseLimit(input: UpdateFormResponseLimitType) {
    const { formId, userRole, responseLimit } = await updateFormResponseLimit.parseAsync(input);
    if (userRole !== "admin") {
      throw serviceError("FORBIDDEN", "Only an administrator can update the form response limit");
    }

    const [updatedForm] = await db
      .update(form)
      .set({ responseLimit })
      .where(and(eq(form.id, formId), eq(form.isArchived, false)))
      .returning({ id: form.id, responseLimit: form.responseLimit });

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
  }

  public async updateFormResponseLimit(input: UpdateFormResponseLimitType) {
    return this.updateResponseLimit(input);
  }

  public async incrementFormViewCount(input: IncrementFormViewCountType) {
    const { formId, respondentId } = await incrementFormViewCount.parseAsync(input);
    return db.transaction(async (tx) => {
      const [publicForm] = await tx
        .select({
          id: form.id,
          views: form.views,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(and(
          eq(form.id, formId),
          eq(form.isPublished, true),
          isNotNull(form.userId),
        ))
        .for("share");
      if (
        !publicForm ||
        deriveFormLifecycle(publicForm.isPublished, publicForm.isArchived) === "archived"
      ) {
        throw serviceError("NOT_FOUND", "Form no longer available");
      }

      const [newView] = await tx
        .insert(formView)
        .values({ formId, respondentId })
        .onConflictDoNothing()
        .returning({ id: formView.id });
      if (!newView) {
        const [currentForm] = await tx
          .select({
            id: form.id,
            views: form.views,
            isPublished: form.isPublished,
            isArchived: form.isArchived,
          })
          .from(form)
          .where(eq(form.id, formId));
        if (
          !currentForm ||
          deriveFormLifecycle(currentForm.isPublished, currentForm.isArchived) === "archived"
        ) {
          throw serviceError("NOT_FOUND", "Form no longer available");
        }
        return currentForm;
      }

      const [updatedForm] = await tx
        .update(form)
        .set({ views: sql`${form.views} + 1` })
        .where(eq(form.id, formId))
        .returning({ id: form.id, views: form.views });
      if (!updatedForm) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to count this form view");
      return updatedForm;
    });
  }

  public async publishForm(input: PublishFormType) {
    const { formId, userId } = await publishForm.parseAsync(input);

    return db.transaction(async (tx) => {
      const [currentForm] = await tx
        .select({
          title: form.title,
          isArchived: form.isArchived,
          currentVersion: form.currentVersion,
        })
        .from(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)));

      if (!currentForm) {
        throw serviceError("NOT_FOUND", "Form not found");
      }
      if (deriveFormLifecycle(false, currentForm.isArchived) === "archived") {
        throw serviceError("CONFLICT", "Archived forms cannot be changed");
      }

      const currentFields = await tx
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(formField.fieldOrder);
      if (currentFields.length === 0) {
        throw serviceError("BAD_REQUEST", "Add at least one field before publishing this form");
      }
      if (currentFields.some((field) => !field.label.trim())) {
        throw serviceError("BAD_REQUEST", "Every field needs a non-empty label before publishing");
      }
      if (currentFields.some((field) => {
        if (field.type !== "select" && field.type !== "multiselect") return false;
        if (!field.config || typeof field.config !== "object" || Array.isArray(field.config)) return true;
        const options = (field.config as { options?: unknown }).options;
        return !Array.isArray(options) || options.length === 0 ||
          options.some((option) => typeof option !== "string" || !option.trim());
      })) {
        throw serviceError("BAD_REQUEST", "Every select field needs at least one non-empty option");
      }
      const [currentSnapshot] = await tx
        .select({ fieldsJson: formSnapshot.fieldsJson })
        .from(formSnapshot)
        .where(and(
          eq(formSnapshot.formId, formId),
          eq(formSnapshot.versions, currentForm.currentVersion),
        ))
        .orderBy(desc(formSnapshot.createdAt))
        .limit(1);
      const unchanged = currentSnapshot !== undefined &&
        fieldSetHash(currentFields) === fieldSetHash(currentSnapshot.fieldsJson);
      const publishFormURL = `${formId}-${slugifyFormTitle(currentForm.title)}`;
      const [updatedForm] = await tx
        .update(form)
        .set({
          formUrl: publishFormURL,
          isPublished: true,
          currentVersion: unchanged
            ? form.currentVersion
            : sql<number>`${form.currentVersion} + 1`,
        })
        .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
        .returning({ ...this.formSelection(), currentVersion: form.currentVersion });

      if (!updatedForm) {
        throw serviceError("NOT_FOUND", "Form not found");
      }

      if (!unchanged) {
        await formSnapshotService.createSnapshot(
          {
            formId,
            version: updatedForm.currentVersion,
          },
          tx,
        );
      }

      const { currentVersion: _currentVersion, ...publishedForm } = updatedForm;
      return publishedForm;
    });
  }

  public async unpublishForm(input: UnpublishFormType) {
    const { formId, userId } = await unpublishForm.parseAsync(input);

    // check the form's ACTUAL current state in the DB, never trust
    // an isPublished value coming from client input for this decision
    const [existingForm] = await db
      .select({ isPublished: form.isPublished, isArchived: form.isArchived })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!existingForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }
    if (deriveFormLifecycle(existingForm.isPublished, existingForm.isArchived) === "archived") {
      throw serviceError("CONFLICT", "Archived forms cannot be changed");
    }

    if (!existingForm.isPublished) {
      throw serviceError("CONFLICT", "Form is already unpublished");
    }

    const [updatedForm] = await db
      .update(form)
      .set({ isPublished: false })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
  }
}
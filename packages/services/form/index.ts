import { and, db, desc, eq, isNotNull, sql } from "@repo/database";
import {
  createInitialForm,
  deleteForm,
  type CreateInitialFormType,
  type DeleteFormType,
  getFormById,
  type GetFormByIdType,
  getPublicFormById,
  type GetPublicFormByIdType,
  listFormsByUser,
  type ListFormsByUserType,
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
import { form, formField, formSnapshot } from "@repo/database/models/form-schema";
import { env } from "../env";
import FormSnapshotService from "../form_snapshot";
import { assertFormAccess } from "./access";
import { fieldSetHash } from "./snapshot-utils";
import { serviceError } from "../errors";

const formSnapshotService = new FormSnapshotService();

export default class FormService {
  private formSelection() {
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      formUrl: form.formUrl,
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
      .select(this.formSelection())
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!foundForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return foundForm;
  }

  public async getPublicFormById(input: GetPublicFormByIdType, userId?: string | null) {
    const { formId } = await getPublicFormById.parseAsync(input);
    const [foundForm] = await db
      .select(this.formSelection())
      .from(form)
      .where(and(
        eq(form.id, formId),
        eq(form.isPublished, true),
        eq(form.isArchived, false),
        isNotNull(form.userId),
      ));

    if (!foundForm) throw serviceError("NOT_FOUND", "Form not found");
    assertFormAccess(foundForm.accessPolicy, userId);
    return foundForm;
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
    const { formId, userId } = await deleteForm.parseAsync(input);

    const [deletedForm] = await db
      .update(form)
      .set({ isArchived: true, isPublished: false, isOpen: false })
      .where(and(eq(form.id, formId), eq(form.userId, userId), eq(form.isArchived, false)))
      .returning({ id: form.id });

    if (!deletedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return deletedForm;
  }

  public async listFormsByUser(input: ListFormsByUserType) {
    const { userId } = await listFormsByUser.parseAsync(input);

    return db
      .select(this.formSelection())
      .from(form)
      .where(eq(form.userId, userId))
      .orderBy(desc(form.createdAt));
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
    const { formId } = await incrementFormViewCount.parseAsync(input);
    const [updatedForm] = await db
      .update(form)
      .set({ views: sql`${form.views} + 1` })
      .where(and(
        eq(form.id, formId),
        eq(form.isPublished, true),
        eq(form.isArchived, false),
        isNotNull(form.userId),
      ))
      .returning({ id: form.id, views: form.views });

    if (!updatedForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }

    return updatedForm;
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
      if (currentForm.isArchived) throw serviceError("FORBIDDEN", "Archived forms cannot be published");

      const currentFields = await tx
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(formField.fieldOrder);
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
      const slug = currentForm.title.trim().replace(/\s+/g, "-").toLowerCase();
      const publishFormURL = `${env.WEB_URL}/form/${formId}-${slug}`;
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
    if (existingForm.isArchived) throw serviceError("FORBIDDEN", "Archived forms cannot be changed");

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
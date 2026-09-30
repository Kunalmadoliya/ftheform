import { and, asc, db, desc, eq, sql } from "@repo/database";
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
  toggleFormOpenStatus,
  type ToggleFormOpenStatusType,
  publicForm,
  type PublicFormType,
} from "./model";
import { form, formField, formSnapshot } from "@repo/database/models/form-schema";
import { env } from "../env";

export default class FormService {
  private formSelection() {
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      formUrl: form.formUrl,
      isPublished: form.isPublished,
      createdAt: form.createdAt,
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
      throw new Error("Form creation failed");
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
      throw new Error("Form not found");
    }

    return foundForm;
  }

  public async getPublicFormById(input: GetPublicFormByIdType) {
    const { formId } = await getPublicFormById.parseAsync(input);
    const [foundForm] = await db
      .select({ ...this.formSelection(), isOpen: form.isOpen })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.isPublished, true)));

    if (!foundForm) throw new Error("Form not found");
    return foundForm;
  }

  public async renameForm(input: RenameFormType) {
    const { formId, title, userId } = await renameForm.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ title })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async updateFormDescription(input: UpdateFormDescriptionType) {
    const { formId, description, userId } = await updateFormDescription.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ description })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async deleteForm(input: DeleteFormType) {
    const { formId, userId } = await deleteForm.parseAsync(input);

    const [deletedForm] = await db
      .delete(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning({ id: form.id });

    if (!deletedForm) {
      throw new Error("Form not found");
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

  public async toggleFormOpenStatus(input: ToggleFormOpenStatusType) {
    const { formId, userId, isOpen } = await toggleFormOpenStatus.parseAsync(input);

    const [updatedForm] = await db
      .update(form)
      .set({ isOpen })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async incrementFormViewCount(formId: string) {
    const [updatedForm] = await db
      .update(form)
      .set({ views: sql`${form.views} + 1` })
      .where(eq(form.id, formId))
      .returning({ id: form.id, views: form.views });

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async publishForm(input: PublicFormType) {
    const { formId, userId, title } = await publicForm.parseAsync(input);

    const slug = title.replace(/\s+/g, "-").toLowerCase();
    const publishFormURL = `${env.WEB_URL}/form/${formId}-${slug}`;

    return db.transaction(async (tx) => {
      const [updatedForm] = await tx
        .update(form)
        .set({
          formUrl: publishFormURL,
          isPublished: true,
          currentVersion: sql<number>`${form.currentVersion} + 1`,
        })
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .returning({ ...this.formSelection(), currentVersion: form.currentVersion });

      if (!updatedForm) {
        throw new Error("Form not found");
      }

      const fields = await tx
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(asc(formField.fieldOrder));

      const [snapshot] = await tx
        .insert(formSnapshot)
        .values({
          formId,
          versions: updatedForm.currentVersion,
          fieldsJson: fields,
        })
        .returning({ id: formSnapshot.id });

      if (!snapshot) {
        throw new Error("Failed to create form snapshot");
      }

      const { currentVersion: _currentVersion, ...publishedForm } = updatedForm;
      return publishedForm;
    });
  }

  public async unpublishForm(input: PublicFormType) {
    const { formId, userId } = await publicForm.parseAsync(input);

    // check the form's ACTUAL current state in the DB, never trust
    // an isPublished value coming from client input for this decision
    const [existingForm] = await db
      .select({ isPublished: form.isPublished })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!existingForm) {
      throw new Error("Form not found");
    }

    if (!existingForm.isPublished) {
      throw new Error("Form is already unpublished");
    }

    const [updatedForm] = await db
      .update(form)
      .set({ isPublished: false })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }
}
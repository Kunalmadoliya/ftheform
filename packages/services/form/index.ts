import { and, db, desc, eq } from "@repo/database";
import {
  createInitialForm,
  deleteForm,
  type CreateInitialFormType,
  type DeleteFormType,
  getFormById,
  type GetFormByIdType,
  listFormsByUser,
  type ListFormsByUserType,
  renameForm,
  type RenameFormType,
  updateFormDescription,
  type UpdateFormDescriptionType,
  toggleFormOpenStatus,
  type ToggleFormOpenStatusType,
} from "./model";
import { form } from "@repo/database/models/form-schema";

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

    if (!formId || !userId) {
      throw new Error("Form ID and User ID are required");
    }

    const [foundForm] = await db
      .select(this.formSelection())
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!foundForm) {
      throw new Error("Form not found");
    }

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
}

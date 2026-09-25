import { and, db, desc, eq, sql } from "@repo/database";
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
  publicForm,
  type PublicFormType,
} from "./model";
import { form } from "@repo/database/models/form-schema";
import {env} from "../env"

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

  public async incrementFormViewCount(formId: string) {
    const updatedForm = await db
      .update(form)
      .set({ views: sql`{form.views} + 1` })
      .where(eq(form.id, formId))
      .returning({ id: form.id, views: form.views });

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async publicForm(input: PublicFormType) {
    const { formId, userId, isPublished  , title} = await publicForm.parseAsync(input);
      
      const publishFormURL = env.WEB_URL + "/form/" + formId + title.replace(/\s+/g, "-").toLowerCase();

    const [updatedForm] = await db
      .update(form)
      .set({ formUrl: publishFormURL, isPublished })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }

  public async unpublishForm(input: PublicFormType) {
    const { formId, userId, isPublished } = await publicForm.parseAsync(input);

    if(!isPublished){
      throw new Error("Form is already unpublished");
    }

    const [updatedForm] = await db
      .update(form)
      .set({ isPublished : false })
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .returning(this.formSelection());

    if (!updatedForm) {
      throw new Error("Form not found");
    }

    return updatedForm;
  }
}
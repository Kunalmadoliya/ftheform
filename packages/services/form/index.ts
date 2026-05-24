import { randomBytes } from "node:crypto";

import { db, eq } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formsFeildsTable } from "@repo/database/models/form-feilds";
import { ApiError } from "@repo/api-responses/api-error";

import {
  createFormInput,
  CreateFormInputType,
  updateFormInput,
  UpdateFormInputType,
  getFormByIdInput,
  GetFormByIdInputType,
  deleteFormInput,
  DeleteFormInputType,
} from "./model";

class FormService {


   
    
  private generateFormLink(): string {
    return  `https://ftheform.kunalmadoliya.me/${randomBytes(8).toString("hex")}`;
  }


  private async assertFormOwner(formId: string, userId: string) {
    const form = await db
      .select({ id: formsTable.id, createdBy: formsTable.createdBy })
      .from(formsTable)
      .where(eq(formsTable.id, formId));

    if (!form || form.length === 0) {
      throw ApiError.badRequest("Form not found");
    }

    if (form[0]?.createdBy !== userId) {
      throw ApiError.forbidden("You do not have permission to access this form");
    }

    return form[0];
  }

  public async createForm(payload: CreateFormInputType, userId: string) {
    const { title, description, isPublic, fields } =
      await createFormInput.parseAsync(payload);

    const link = this.generateFormLink();

    // Insert the form
    const insertedForm = await db
      .insert(formsTable)
      .values({
        title,
        description,
        is_public: isPublic,
        createdBy: userId,
        link,
      })
      .returning({ id: formsTable.id, link: formsTable.link });

    if (!insertedForm || insertedForm.length === 0 || !insertedForm[0]?.id) {
      throw ApiError.badRequest("Form could not be created");
    }

    const formId = insertedForm[0].id;

    // Insert all fields linked to the new form
    const fieldRows = fields.map((field) => ({
      label: field.label,
      labelKey: field.labelKey,
      description: field.description,
      type: field.type,
      placeholder: field.placeholder,
      isRequired: field.isRequired,
      index: String(field.index),
      formId,
    }));

    await db.insert(formsFeildsTable).values(fieldRows);

    return {
      id: formId,
      link: insertedForm[0].link,
    };
  }

 
  public async getFormById(payload: GetFormByIdInputType, userId: string) {
    const { formId } = await getFormByIdInput.parseAsync(payload);

    const form = await db
      .select({
        id: formsTable.id,
        title: formsTable.title,
        description: formsTable.description,
        isPublic: formsTable.is_public,
        link: formsTable.link,
        createdBy: formsTable.createdBy,
        createdAt: formsTable.createdAt,
        updatedAt: formsTable.updatedAt,
      })
      .from(formsTable)
      .where(eq(formsTable.id, formId));

    if (!form || form.length === 0) {
      throw ApiError.badRequest("Form not found");
    }

    const formData = form[0]!;

    // Private forms are only accessible by their owner
    if (!formData.isPublic && formData.createdBy !== userId) {
      throw ApiError.forbidden("You do not have permission to view this form");
    }

    // Fetch associated fields
    const fields = await db
      .select({
        id: formsFeildsTable.id,
        label: formsFeildsTable.label,
        labelKey: formsFeildsTable.labelKey,
        description: formsFeildsTable.description,
        type: formsFeildsTable.type,
        placeholder: formsFeildsTable.placeholder,
        isRequired: formsFeildsTable.isRequired,
        index: formsFeildsTable.index,
      })
      .from(formsFeildsTable)
      .where(eq(formsFeildsTable.formId, formId));

    return {
      ...formData,
      fields,
    };
  }

  /**
   * Returns all forms created by the authenticated user.
   */
  public async getMyForms(userId: string) {
    const forms = await db
      .select({
        id: formsTable.id,
        title: formsTable.title,
        description: formsTable.description,
        isPublic: formsTable.is_public,
        link: formsTable.link,
        createdAt: formsTable.createdAt,
        updatedAt: formsTable.updatedAt,
      })
      .from(formsTable)
      .where(eq(formsTable.createdBy, userId));

    return forms;
  }

  /**
   * Updates the top-level form metadata (title, description, visibility).
   * Does NOT modify fields — that is a separate concern.
   */
  public async updateForm(payload: UpdateFormInputType, userId: string) {
    const { formId, title, description, isPublic } =
      await updateFormInput.parseAsync(payload);

    await this.assertFormOwner(formId, userId);

    const updatedForm = await db
      .update(formsTable)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { is_public: isPublic }),
      })
      .where(eq(formsTable.id, formId))
      .returning({
        id: formsTable.id,
        title: formsTable.title,
        description: formsTable.description,
        isPublic: formsTable.is_public,
        link: formsTable.link,
      });

    if (!updatedForm || updatedForm.length === 0) {
      throw ApiError.badRequest("Form could not be updated");
    }

    return updatedForm[0];
  }

  /**
   * Deletes a form and all of its associated fields.
   * Only the form owner can delete.
   */
  public async deleteForm(payload: DeleteFormInputType, userId: string) {
    const { formId } = await deleteFormInput.parseAsync(payload);

    await this.assertFormOwner(formId, userId);

    // Delete fields first (FK constraint)
    await db
      .delete(formsFeildsTable)
      .where(eq(formsFeildsTable.formId, formId));

    await db.delete(formsTable).where(eq(formsTable.id, formId));

    return { success: true };
  }
}

export default FormService;

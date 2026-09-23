import { and, db, eq, sql } from "@repo/database";
import {
  createFormField,
  type CreateFormFieldType,
  listFormFields,
  type ListFormFieldsType,
  updateForm,
  type UpdateFormType,
} from "./model";
import { form, formField } from "@repo/database/models/form-schema";

export default class FormFieldService {
  private async validateFormOwnership(formId: string, userId: string) {
    const formExists = await db
      .select()
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (formExists.length === 0) {
      throw new Error("Form not found or does not belong to the user");
    }

    return formExists;
  }

  public async listFormFields(input: ListFormFieldsType) {
    const { formId, userId } = await listFormFields.parseAsync(input);

    // Validate that the form exists and belongs to the user
    await this.validateFormOwnership(formId, userId);
    const formResults = await db
      .select()
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(formField.fieldOrder);

    return formResults;
  }

  public async createFormField(input: CreateFormFieldType) {
    const { formId, type, category, label, required, config, userId } =
      await createFormField.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    const result = await db
      .select({ maxOrder: sql<number>`max(${formField.fieldOrder})` })
      .from(formField)
      .where(eq(formField.formId, formId));

    const nextOrder = (result[0]?.maxOrder ?? -1) + 1;

    const [newField] = await db
      .insert(formField)
      .values({
        formId,
        type,
        category,
        label,
        required,
        config,
        fieldOrder: nextOrder,
      })
      .returning();

    if (!newField) {
      throw new Error("Form field creation failed");
    }

    return newField;
  }

  public async deleteFormField(formId: string, fieldId: string, userId: string) {
    await this.validateFormOwnership(formId, userId);

    const [deletedField] = await db
      .delete(formField)
      .where(and(eq(formField.id, fieldId), eq(formField.formId, formId)))
      .returning({ id: formField.id });

    if (!deletedField) {
      throw new Error("Form field not found");
    }

    return deletedField;
  }

  public async updateFormField(input: UpdateFormType) {
    const { formFieldId, formId, type, category, label, required, config, userId } =
      await updateForm.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    const [updatedFormField] = await db
      .update(formField)
      .set({
        type,
        category,
        label,
        required,
        config,
      })
      .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
      .returning();

    if (!updatedFormField) {
      throw new Error("Form field not found");
    }

    return updatedFormField;
  }
}

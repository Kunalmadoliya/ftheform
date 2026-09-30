import { and, db, eq, sql, asc } from "@repo/database";
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
    const [owns] = await db
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!owns) {
      throw new Error("Form not found or does not belong to the user");
    }
  }

  public async listFormFields(input: ListFormFieldsType) {
    const { formId, userId } = await listFormFields.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    return db
      .select()
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(asc(formField.fieldOrder));
  }

  public async createFormField(input: CreateFormFieldType) {
    const { formId, type, category, label, required, config, userId } =
      await createFormField.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    return db.transaction(async (tx) => {
      const result = await tx
        .select({ maxOrder: sql<number>`max(${formField.fieldOrder})` })
        .from(formField)
        .where(eq(formField.formId, formId));

      const nextOrder = (result[0]?.maxOrder ?? -1) + 1;

      const [newField] = await tx
        .insert(formField)
        .values({ formId, type, category, label, required, config, fieldOrder: nextOrder })
        .returning();

      if (!newField) {
        throw new Error("Form field creation failed");
      }

      return newField;
    });
  }

  public async updateFormField(input: UpdateFormType) {
    const { formFieldId, formId, type, category, label, required, config, userId, fieldOrder } =
      await updateForm.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    return db.transaction(async (tx) => {
      const [updatedFormField] = await tx
        .update(formField)
        .set({ type, category, label, required, config, fieldOrder })
        .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
        .returning();

      if (!updatedFormField) {
        throw new Error("Form field not found");
      }

      return updatedFormField;
    });
  }

  // use this for drag-and-drop, NOT updateFormField: one drag = one version
  public async reorderFormFields(formId: string, orderedFieldIds: string[], userId: string) {
    await this.validateFormOwnership(formId, userId);

    return db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: formField.id })
        .from(formField)
        .where(eq(formField.formId, formId));

      const existingIds = new Set(existing.map((f) => f.id));
      const incomingIds = new Set(orderedFieldIds);

      // list must contain every field of this form exactly once
      if (
        incomingIds.size !== orderedFieldIds.length ||
        incomingIds.size !== existingIds.size ||
        orderedFieldIds.some((id) => !existingIds.has(id))
      ) {
        throw new Error("Reorder list must contain each field of this form exactly once");
      }

      for (const [index, id] of orderedFieldIds.entries()) {
        await tx
          .update(formField)
          .set({ fieldOrder: index })
          .where(and(eq(formField.id, id), eq(formField.formId, formId)));
      }

      return { reordered: orderedFieldIds.length };
    });
  }

  public async deleteFormField(formId: string, fieldId: string, userId: string) {
    await this.validateFormOwnership(formId, userId);

    return db.transaction(async (tx) => {
      const [deletedField] = await tx
        .delete(formField)
        .where(and(eq(formField.id, fieldId), eq(formField.formId, formId)))
        .returning({ id: formField.id });

      if (!deletedField) {
        throw new Error("Form field not found");
      }

      return deletedField;
    });
  }
}

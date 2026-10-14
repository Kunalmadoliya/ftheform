import { and, db, eq, sql, asc } from "@repo/database";
import {
  createFormField,
  type CreateFormFieldType,
  listFormFields,
  type ListFormFieldsType,
  updateForm,
  type UpdateFormType,
  reorderFields as reorderFieldsSchema,
  type ReorderFieldsType,
  deleteFormField as deleteFormFieldSchema,
  type DeleteFormFieldType,
} from "./model";
import { form, formField } from "@repo/database/models/form-schema";
import type { GeneratedFormField } from "../form_ai/model";

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

  public async createGeneratedFieldsInTransaction(
    tx: Pick<typeof db, "select" | "insert">,
    formId: string,
    userId: string,
    fields: GeneratedFormField[],
  ) {
    const [ownedForm] = await tx
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw new Error("Form not found");

    const [orderResult] = await tx
      .select({ maxOrder: sql<number>`max(${formField.fieldOrder})` })
      .from(formField)
      .where(eq(formField.formId, formId));
    if (!orderResult) throw new Error("Unable to determine the next form field order");

    const startingOrder = (orderResult.maxOrder ?? -1) + 1;
    const createdFields = await tx
      .insert(formField)
      .values(
        fields.map((field, index) => ({
          formId,
          type: field.type,
          category: field.category,
          label: field.label,
          required: field.required,
          config: field.config ?? null,
          fieldOrder: startingOrder + index,
        })),
      )
      .returning();

    if (createdFields.length !== fields.length) {
      throw new Error("Generated form fields were not all persisted");
    }
    return createdFields;
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

  public async reorderFields(input: ReorderFieldsType) {
    const { formId, orderedFieldIds, userId } = await reorderFieldsSchema.parseAsync(input);
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
        const [reorderedField] = await tx
          .update(formField)
          .set({ fieldOrder: index })
          .where(and(eq(formField.id, id), eq(formField.formId, formId)))
          .returning({ id: formField.id });
        if (!reorderedField) throw new Error("Form field not found during reorder");
      }

      return { reordered: orderedFieldIds.length };
    });
  }

  public async reorderFormFields(formId: string, orderedFieldIds: string[], userId: string) {
    return this.reorderFields({ formId, orderedFieldIds, userId });
  }

  public async deleteFormField(input: DeleteFormFieldType) {
    const { formId, formFieldId, userId } = await deleteFormFieldSchema.parseAsync(input);
    await this.validateFormOwnership(formId, userId);

    return db.transaction(async (tx) => {
      const [deletedField] = await tx
        .delete(formField)
        .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
        .returning({ id: formField.id });

      if (!deletedField) {
        throw new Error("Form field not found");
      }

      return deletedField;
    });
  }
}

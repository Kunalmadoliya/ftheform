import { and, count, db, eq, sql, asc } from "@repo/database";
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
import { generatedFieldConfigSchema, type GeneratedFormField } from "../form_ai/model";
import { serviceError } from "../errors";
import { deriveFormLifecycle } from "../form/model";

export const MAX_FORM_FIELDS = 100;

export default class FormFieldService {
  private async validateFormOwnership(formId: string, userId: string) {
    const [owns] = await db
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!owns) {
      throw serviceError("NOT_FOUND", "Form not found");
    }
  }

  private async lockOwnedWritableForm(
    tx: Pick<typeof db, "select">,
    formId: string,
    userId: string,
  ) {
    const [ownedForm] = await tx
      .select({ id: form.id, isPublished: form.isPublished, isArchived: form.isArchived })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .for("update");
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
    if (deriveFormLifecycle(ownedForm.isPublished, ownedForm.isArchived) === "archived") {
      throw serviceError("CONFLICT", "Archived forms cannot be changed");
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

    return db.transaction(async (tx) => {
      await this.lockOwnedWritableForm(tx, formId, userId);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${"form-fields:" + formId}, 0))`);
      const [fieldCount] = await tx
        .select({ count: count() })
        .from(formField)
        .where(eq(formField.formId, formId));
      if (!fieldCount) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form field limit");
      if (fieldCount.count >= MAX_FORM_FIELDS) {
        throw serviceError("TOO_MANY_REQUESTS", "This form has reached its field limit");
      }
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
        throw serviceError("INTERNAL_SERVER_ERROR", "Form field creation failed");
      }
      return newField;
    });
  }

  public async createGeneratedFieldsInTransaction(
    tx: Pick<typeof db, "select" | "insert" | "execute">,
    formId: string,
    userId: string,
    fields: GeneratedFormField[],
  ) {
    const [ownedForm] = await tx
      .select({ id: form.id, isPublished: form.isPublished, isArchived: form.isArchived })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .for("update");
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
    if (deriveFormLifecycle(ownedForm.isPublished, ownedForm.isArchived) === "archived") {
      throw serviceError("CONFLICT", "Archived forms cannot be changed");
    }
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${"form-fields:" + formId}, 0))`);

    const [orderResult] = await tx
      .select({ maxOrder: sql<number>`max(${formField.fieldOrder})` })
      .from(formField)
      .where(eq(formField.formId, formId));
    if (!orderResult) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to determine form field order");

    const [fieldCount] = await tx
      .select({ count: count() })
      .from(formField)
      .where(eq(formField.formId, formId));
    if (!fieldCount) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form field limit");
    if (fieldCount.count + fields.length > MAX_FORM_FIELDS) {
      throw serviceError("TOO_MANY_REQUESTS", "Generated fields would exceed the form field limit");
    }

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
      throw serviceError("INTERNAL_SERVER_ERROR", "Generated form fields were not all persisted");
    }
    return createdFields;
  }

  public async updateFormField(input: UpdateFormType) {
    const { formFieldId, formId, type, category, label, required, config, userId, fieldOrder } =
      await updateForm.parseAsync(input);

    return db.transaction(async (tx) => {
      await this.lockOwnedWritableForm(tx, formId, userId);
      const [currentField] = await tx
        .select()
        .from(formField)
        .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
        .for("update");
      if (!currentField) {
        throw serviceError("NOT_FOUND", "Form field not found");
      }
      const nextConfig = config === undefined ? currentField.config ?? undefined : config;
      const validatedField = generatedFieldConfigSchema.parse({
        type: type ?? currentField.type,
        category: category ?? currentField.category,
        label: label ?? currentField.label,
        required: required ?? currentField.required,
        ...(nextConfig === undefined ? {} : { config: nextConfig }),
      });
      const [updatedFormField] = await tx
        .update(formField)
        .set({
          type: validatedField.type,
          category: validatedField.category,
          label: validatedField.label,
          required: validatedField.required,
          config: validatedField.config ?? null,
          fieldOrder: fieldOrder ?? currentField.fieldOrder,
        })
        .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
        .returning();

      if (!updatedFormField) {
        throw serviceError("NOT_FOUND", "Form field not found");
      }

      return updatedFormField;
    });
  }

  public async reorderFields(input: ReorderFieldsType) {
    const { formId, orderedFieldIds, userId } = await reorderFieldsSchema.parseAsync(input);
    return db.transaction(async (tx) => {
      await this.lockOwnedWritableForm(tx, formId, userId);
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
        throw serviceError("BAD_REQUEST", "Reorder list must contain each field of this form exactly once");
      }

      for (const [index, id] of orderedFieldIds.entries()) {
        const [reorderedField] = await tx
          .update(formField)
          .set({ fieldOrder: index })
          .where(and(eq(formField.id, id), eq(formField.formId, formId)))
          .returning({ id: formField.id });
        if (!reorderedField) throw serviceError("NOT_FOUND", "Form field not found");
      }

      return { reordered: orderedFieldIds.length };
    });
  }

  public async reorderFormFields(formId: string, orderedFieldIds: string[], userId: string) {
    return this.reorderFields({ formId, orderedFieldIds, userId });
  }

  public async deleteFormField(input: DeleteFormFieldType) {
    const { formId, formFieldId, userId } = await deleteFormFieldSchema.parseAsync(input);
    return db.transaction(async (tx) => {
      await this.lockOwnedWritableForm(tx, formId, userId);
      const [deletedField] = await tx
        .delete(formField)
        .where(and(eq(formField.id, formFieldId), eq(formField.formId, formId)))
        .returning({ id: formField.id });

      if (!deletedField) {
        throw serviceError("NOT_FOUND", "Form field not found");
      }

      return deletedField;
    });
  }
}

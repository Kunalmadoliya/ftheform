import { and, db, eq, sql, asc } from "@repo/database";
import {
  createFormField,
  type CreateFormFieldType,
  listFormFields,
  type ListFormFieldsType,
  updateForm,
  type UpdateFormType,
} from "./model";
import { form, formField, formSnapshot } from "@repo/database/models/form-schema";

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

  // shared helper: snapshot the form's current full field list into
  // a new FORM_SNAPSHOT row, and bump the form's currentVersion —
  // wrapped in a transaction so a failed snapshot insert can never
  // leave currentVersion bumped with no matching snapshot row
  private async createSnapshotAndBumpVersion(formId: string) {
    return db.transaction(async (tx) => {
      const currentFields = await tx
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(asc(formField.fieldOrder));

      const [updatedForm] = await tx
        .update(form)
        .set({ currentVersion: sql<number>`${form.currentVersion} + 1` })
        .where(eq(form.id, formId))
        .returning({ currentVersion: form.currentVersion });

      if (!updatedForm) {
        throw new Error("Having issues updating the form version");
      }

      const [newSnapshot] = await tx
        .insert(formSnapshot)
        .values({
          formId,
          version: updatedForm.currentVersion,
          fieldsJson: currentFields,
        })
        .returning();

      if (!newSnapshot) {
        throw new Error("Failed to create form snapshot");
      }

      return newSnapshot;
    });
  }

  public async listFormFields(input: ListFormFieldsType) {
    const { formId, userId } = await listFormFields.parseAsync(input);

    await this.validateFormOwnership(formId, userId);

    const formResults = await db
      .select()
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(asc(formField.fieldOrder));

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

    const [checkIsPublished] = await db
      .select({ isPublished: form.isPublished })
      .from(form)
      .where(eq(form.id, formId));

    if (checkIsPublished?.isPublished) {
      await this.createSnapshotAndBumpVersion(formId);
    }

    return updatedFormField;
  }

  public async deleteFormField(formId: string, fieldId: string, userId: string) {
    await this.validateFormOwnership(formId, userId);

    const [checkIsPublished] = await db
      .select({ isPublished: form.isPublished })
      .from(form)
      .where(eq(form.id, formId));

    const [deletedField] = await db
      .delete(formField)
      .where(and(eq(formField.id, fieldId), eq(formField.formId, formId)))
      .returning({ id: formField.id });

    if (!deletedField) {
      throw new Error("Form field not found");
    }

    if (checkIsPublished?.isPublished) {
      await this.createSnapshotAndBumpVersion(formId);
    }

    return deletedField;
  }
}
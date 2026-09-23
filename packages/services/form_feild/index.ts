import { and, db, eq } from "@repo/database";
import {
  createFormField,
  CreateFormFieldType,
  listFormFields,
  type ListFormFieldsType,
} from "./model";
import { form, formField } from "@repo/database/models/form-schema";
import { user } from "@repo/database/auth-schema";

export default class FormFieldService {
   
  private async validateFormOwnership(formId: string, userId: string) {
    const formExists = await db
      .select()
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!formExists) {
      throw new Error("Form not found or does not belong to the user");
    }

    return formExists
  }


  public async listFormFields(input: ListFormFieldsType) {
    const { formId, userId } = await listFormFields.parseAsync(input);

    // Validate that the form exists and belongs to the user
    await this.validateFormOwnership(formId, userId);
    const [formResult] = await db
      .select()
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(formField.fieldOrder);

    return formResult;
  }

  public async createFormField(input: CreateFormFieldType) {
    const { formId, type, category, label, required, fieldOrder, config } =
      await createFormField.parseAsync(input);
    return await db
      .insert(formField)
      .values({
        formId,
        type,
        category,
        label,
        required,
        fieldOrder,
        config,
      })
      .returning();
  }
}

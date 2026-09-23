import { db, eq, and } from "@repo/database";
import {
  createInitialForm,
  type CreateInitialFormType,
  getFormById,
  type GetFormByIdType,
} from "./model";
import { form } from "@repo/database/models/form-schema";

export default class FormService {
  public async createInitialForm(input: CreateInitialFormType) {
    const { title, description, userId } = await createInitialForm.parseAsync(input);

    const [newForm] = await db
      .insert(form)
      .values({
        title,
        description,
        userId,
      })
      .returning({
        id: form.id,
        title: form.title,
        description: form.description,
        formUrl: form.formUrl,
        isPublished: form.isPublished,
        createdAt: form.createdAt,
      });

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
      .select({
        id: form.id,
        title: form.title,
        description: form.description,
        formUrl: form.formUrl,
        isPublished: form.isPublished,
        createdAt: form.createdAt,
      })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));

    if (!foundForm) {
      throw new Error("Form not found");
    }

    return foundForm;
  }
}

import { db } from "@repo/database";
import { createInitialForm, type CreateInitialFormType } from "./model";
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
}
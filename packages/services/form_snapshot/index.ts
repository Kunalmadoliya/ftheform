import {
  getLatestFormSnapshotById,
  type getFormSnapshotType,
  getLatestFormSnapshotInput,
  type getFormSnapshotInputType,
} from "./model";
import { formSnapshot, form } from "@repo/database/models/form-schema";
import { and, db, eq } from "@repo/database";

export default class FormSnapshot {
  public async getLatestFormSnapshotById(input: getFormSnapshotType) {
    const { formId } = await getLatestFormSnapshotById.parseAsync(input);

    const checkForm = await db
      .select({ currentVersion: form.currentVersion })
      .from(form)
      .where(eq(form.id, formId))
      .limit(1);

    if (!checkForm) {
      throw new Error("Form not found");
    }

    return checkForm;
  }

  public async getLatestFormSnapshot(input: getFormSnapshotInputType) {
    const { formId, formSnapshotId } = await getLatestFormSnapshotInput.parseAsync(input);

    const checkFormSnapshot = await db
      .select()
      .from(formSnapshot)
      .where(and(eq(form.id, formId), eq(formSnapshot.id, formSnapshotId)))
      .limit(1);

    if (!checkFormSnapshot) {
      throw new Error("Form snapshot not found");
    }

    return checkFormSnapshot;
  }
  
}

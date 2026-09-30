import {
  getLatestFormSnapshotById,
  type getFormSnapshotType,
  getLatestFormSnapshotInput,
  type getFormSnapshotInputType,
  createSnapshotInput,
  type createSnapshotInputType,
} from "./model";
import { formSnapshot, form, formField } from "@repo/database/models/form-schema";
import { and, asc, db, desc, eq, sql } from "@repo/database";

export default class FormSnapshot {
  public async getLatestFormSnapshotById(input: getFormSnapshotType) {
    const { formId } = await getLatestFormSnapshotById.parseAsync(input);

    const [checkForm] = await db
      .select({ currentVersion: form.currentVersion })
      .from(form)
      .where(eq(form.id, formId))
      .limit(1);

    if (!checkForm) {
      throw new Error("Form not found");
    }

    const [snapshot] = await db
      .select()
      .from(formSnapshot)
      .where(and(eq(formSnapshot.formId, formId), eq(formSnapshot.versions, checkForm.currentVersion)))
      .orderBy(desc(formSnapshot.createdAt))
      .limit(1);

    if (!snapshot) throw new Error("Form snapshot not found");
    return snapshot;
  }

  public async getLatestFormSnapshot(input: getFormSnapshotInputType) {
    const { formId, formSnapshotId } = await getLatestFormSnapshotInput.parseAsync(input);

    const [checkFormSnapshot] = await db
      .select()
      .from(formSnapshot)
      .where(and(eq(formSnapshot.formId, formId), eq(formSnapshot.id, formSnapshotId)))
      .orderBy(desc(formSnapshot.createdAt))
      .limit(1);

    if (!checkFormSnapshot) {
      throw new Error("Form snapshot not found");
    }

    return checkFormSnapshot;
  }

  public async getSnapshotById(input: getFormSnapshotInputType) {
    return this.getLatestFormSnapshot(input);
  }

  public async getLatestSnapshot(input: getFormSnapshotType) {
    return this.getLatestFormSnapshotById(input);
  }

  public async createSnapshot(input: createSnapshotInputType) {
    const { formId } = await createSnapshotInput.parseAsync(input);
    return db.transaction(async (tx) => {
      const [updatedForm] = await tx
        .update(form)
        .set({ currentVersion: sql<number>`${form.currentVersion} + 1` })
        .where(eq(form.id, formId))
        .returning({ currentVersion: form.currentVersion });
      if (!updatedForm) throw new Error("Form not found");

      const fields = await tx
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(asc(formField.fieldOrder));
      const [snapshot] = await tx
        .insert(formSnapshot)
        .values({ formId, versions: updatedForm.currentVersion, fieldsJson: fields })
        .returning();
      if (!snapshot) throw new Error("Failed to create form snapshot");
      return snapshot;
    });
  }

  public async listFormSnapshots(formId: string) {
    if (!formId) {
      throw new Error("Form id is required");
    }

    const snapshots = await db
      .select()
      .from(formSnapshot)
      .where(eq(formSnapshot.formId, formId))
      .orderBy(desc(formSnapshot.createdAt));

    if (snapshots.length === 0) {
      throw new Error("No snapshots found for this form");
    }

    return snapshots;
  }
}

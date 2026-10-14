import {
  getLatestFormSnapshotById,
  type getFormSnapshotType,
  getLatestFormSnapshotInput,
  type getFormSnapshotInputType,
  createSnapshotInput,
  type createSnapshotInputType,
  listSnapshotsByFormInput,
  type ListSnapshotsByFormInputType,
} from "./model";
import { formSnapshot, form, formField } from "@repo/database/models/form-schema";
import { and, asc, db, desc, eq } from "@repo/database";
import { assertFormAccess } from "../form/access";
import { serviceError } from "../errors";

type SnapshotTransaction = Pick<typeof db, "select" | "insert">;

export default class FormSnapshotService {
  public async getLatestFormSnapshotById(input: getFormSnapshotType, userId?: string | null) {
    const { formId } = await getLatestFormSnapshotById.parseAsync(input);

    const [checkForm] = await db
      .select({
        currentVersion: form.currentVersion,
        isPublished: form.isPublished,
        isOpen: form.isOpen,
        isArchived: form.isArchived,
        ownerId: form.userId,
        accessPolicy: form.accessPolicy,
      })
      .from(form)
      .where(eq(form.id, formId))
      .limit(1);

    if (!checkForm) {
      throw serviceError("NOT_FOUND", "Form not found");
    }
    if (checkForm.isArchived || !checkForm.ownerId) throw serviceError("NOT_FOUND", "Form not found");
    const isOwner = Boolean(userId && checkForm.ownerId === userId);
    if (!checkForm.isPublished && !isOwner) throw serviceError("FORBIDDEN", "Form is not published");
    if (!checkForm.isOpen && !isOwner) throw serviceError("FORBIDDEN", "Form is closed");
    if (!isOwner) assertFormAccess(checkForm.accessPolicy, userId);

    const [snapshot] = await db
      .select()
      .from(formSnapshot)
      .where(and(eq(formSnapshot.formId, formId), eq(formSnapshot.versions, checkForm.currentVersion)))
      .orderBy(desc(formSnapshot.createdAt))
      .limit(1);

    if (!snapshot) {
      if (!isOwner) throw serviceError("NOT_FOUND", "Form snapshot not found");
      const fields = await db
        .select()
        .from(formField)
        .where(eq(formField.formId, formId))
        .orderBy(asc(formField.fieldOrder));
      return {
        id: `preview-${formId}`,
        formId,
        versions: checkForm.currentVersion,
        fieldsJson: fields,
        createdAt: new Date(),
      };
    }
    return snapshot;
  }

  public async getLatestFormSnapshot(input: getFormSnapshotInputType) {
    const { formId, formSnapshotId, userId } = await getLatestFormSnapshotInput.parseAsync(input);

    const [ownedForm] = await db
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)))
      .limit(1);
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");

    const [checkFormSnapshot] = await db
      .select()
      .from(formSnapshot)
      .where(and(eq(formSnapshot.formId, formId), eq(formSnapshot.id, formSnapshotId)))
      .orderBy(desc(formSnapshot.createdAt))
      .limit(1);

    if (!checkFormSnapshot) {
      throw serviceError("NOT_FOUND", "Form snapshot not found");
    }

    return checkFormSnapshot;
  }

  public async getSnapshotById(input: getFormSnapshotInputType) {
    return this.getLatestFormSnapshot(input);
  }

  public async getLatestSnapshot(input: getFormSnapshotType, userId?: string | null) {
    return this.getLatestFormSnapshotById(input, userId);
  }

  public async createSnapshot(input: createSnapshotInputType, tx: SnapshotTransaction) {
    const { formId, version } = await createSnapshotInput.parseAsync(input);
    const fields = await tx
      .select()
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(asc(formField.fieldOrder));
    const [snapshot] = await tx
      .insert(formSnapshot)
      .values({ formId, versions: version, fieldsJson: fields })
      .returning();
    if (!snapshot) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to create form snapshot");
    return snapshot;
  }

  public async listSnapshotsByForm(input: ListSnapshotsByFormInputType) {
    const { formId, userId } = await listSnapshotsByFormInput.parseAsync(input);

    const [ownedForm] = await db
      .select({ id: form.id })
      .from(form)
      .where(and(eq(form.id, formId), eq(form.userId, userId)));
    if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");

    return db
      .select()
      .from(formSnapshot)
      .where(eq(formSnapshot.formId, formId))
      .orderBy(desc(formSnapshot.createdAt));
  }

  public async listFormSnapshots(formId: string, userId: string) {
    return this.listSnapshotsByForm({ formId, userId });
  }
}

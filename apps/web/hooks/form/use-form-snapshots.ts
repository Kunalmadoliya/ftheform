import { trpc } from "~/trpc/client";

export function useLatestFormSnapshot(formId: string, enabled = true) {
  return trpc.formSnapshot.getLatestSnapshot.useQuery(
    { formId },
    { enabled: Boolean(formId) && enabled, retry: false },
  );
}

export function useFormSnapshotById(formId: string, formSnapshotId?: string) {
  return trpc.formSnapshot.getSnapshotById.useQuery(
    { formId, formSnapshotId: formSnapshotId ?? "" },
    { enabled: Boolean(formId && formSnapshotId), retry: false },
  );
}

export function useFormSnapshots(formId: string, enabled = true) {
  return trpc.formSnapshot.listSnapshotsByForm.useQuery(
    { formId },
    { enabled: Boolean(formId) && enabled, retry: false },
  );
}

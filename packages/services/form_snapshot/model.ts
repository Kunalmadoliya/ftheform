import {z} from 'zod';

export const getLatestFormSnapshotInput = z.object({
  formId: z.string().uuid(),
});

export type getFormSnapshotType = z.infer<typeof getLatestFormSnapshotInput>;
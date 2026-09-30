
import { z } from "zod";

export const getLatestFormSnapshotById = z.object({
  formId: z.string().describe("form id"),
});

export type getFormSnapshotType = z.infer<typeof getLatestFormSnapshotById>;


export const getLatestFormSnapshotInput = z.object({
  formId: z.string().describe("form id"),
  formSnapshotId: z.string().describe("form snapshot id")
});

export type getFormSnapshotInputType = z.infer<typeof getLatestFormSnapshotInput>;

export const createSnapshotInput = z.object({
  formId: z.string(),
});

export type createSnapshotInputType = z.infer<typeof createSnapshotInput>;



import { z } from "zod";

export const getLatestFormSnapshotById = z.object({
  formId: z.string().describe("form id"),
});

export type getFormSnapshotType = z.infer<typeof getLatestFormSnapshotById>;


export const getLatestFormSnapshotInput = z.object({
  formId: z.string().describe("form id"),
  formSnapshotId: z.string().describe("form snapshot id"),
  userId: z.string().describe("user id"),
});

export type getFormSnapshotInputType = z.infer<typeof getLatestFormSnapshotInput>;

export const createSnapshotInput = z.object({
  formId: z.string(),
  version: z.number().int().positive(),
});

export type createSnapshotInputType = z.infer<typeof createSnapshotInput>;

export const listSnapshotsByFormInput = z.object({
  formId: z.string().describe("form id"),
  userId: z.string().describe("user id"),
});

export type ListSnapshotsByFormInputType = z.infer<typeof listSnapshotsByFormInput>;

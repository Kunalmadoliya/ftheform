import { protectedProcedure, publicProcedure } from "../../trpc";
import { formSnapshotServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";
import {
  snapshotByFormInput,
  snapshotByIdInput,
  snapshotOutputSchema,
  snapshotsOutputSchema,
} from "./model";

const snapshotsPath = generatePath("/form/:formId/snapshots");
const TAGS = ["Form snapshot"];

export const formSnapshotRouter = {
  getLatestSnapshot: publicProcedure
    .meta({ openapi: { method: "GET", path: snapshotsPath("/latest"), tags: TAGS } })
    .input(snapshotByFormInput)
    .output(snapshotOutputSchema)
    .query(({ input }) => formSnapshotServiceInstance.getLatestSnapshot(input)),

  getSnapshotById: publicProcedure
    .meta({ openapi: { method: "GET", path: snapshotsPath("/:formSnapshotId"), tags: TAGS } })
    .input(snapshotByIdInput)
    .output(snapshotOutputSchema)
    .query(({ input }) => formSnapshotServiceInstance.getSnapshotById(input)),

  listSnapshotsByForm: protectedProcedure
    .meta({
      openapi: { method: "GET", path: snapshotsPath("/"), tags: TAGS, protect: true },
    })
    .input(snapshotByFormInput)
    .output(snapshotsOutputSchema)
    .query(({ input }) => formSnapshotServiceInstance.listFormSnapshots(input.formId)),
};

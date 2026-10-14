import { authenticatedProcedure, protectedProcedure, publicProcedure } from "../../trpc";
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
    .query(({ ctx, input }) =>
      formSnapshotServiceInstance.getLatestSnapshot(input, ctx.userId),
    ),

  getSnapshotById: authenticatedProcedure
    .meta({
      openapi: { method: "GET", path: snapshotsPath("/:formSnapshotId"), tags: TAGS, protect: true },
    })
    .input(snapshotByIdInput)
    .output(snapshotOutputSchema)
    .query(({ ctx, input }) =>
      formSnapshotServiceInstance.getSnapshotById({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  listSnapshotsByForm: protectedProcedure
    .meta({
      openapi: { method: "GET", path: snapshotsPath("/"), tags: TAGS, protect: true },
    })
    .input(snapshotByFormInput)
    .output(snapshotsOutputSchema)
    .query(({ ctx, input }) =>
      formSnapshotServiceInstance.listSnapshotsByForm({
        ...input,
        userId: ctx.userId,
      }),
    ),
};

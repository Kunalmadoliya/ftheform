import { z } from "zod";

const snapshotOutput = z.object({
	id: z.string(),
	formId: z.string(),
	versions: z.number(),
	fieldsJson: z.unknown(),
	createdAt: z.date(),
});

export const snapshotByFormInput = z.object({ formId: z.string() });
export const snapshotByIdInput = z.object({ formId: z.string(), formSnapshotId: z.string() });
export const snapshotOutputSchema = snapshotOutput;
export const snapshotsOutputSchema = z.array(snapshotOutput);



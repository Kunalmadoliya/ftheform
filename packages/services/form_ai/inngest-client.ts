import { Inngest, eventType } from "inngest";
import { z } from "zod";

export const inngest = new Inngest({ id: "ftheform-api" });

export const formGenerationRequested = eventType("form/generation.requested", {
  schema: z.object({ jobId: z.string().uuid() }),
});

import { z } from "zod";


export const validateSubmittedFormVersion = z.object({ 
    formId: z.string().describe("form id"),
});


export type validateSubmittedFormVersionType = z.infer<typeof validateSubmittedFormVersion>;
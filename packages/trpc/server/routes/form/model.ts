import {z} from "zod"

export const createInitialFormInput = z.object({ 
  title: z.string().min(1).describe("The title of the form"),
  description: z.string().optional().describe("The description of the form"),
});

export const createInitialFormOutput = z.object({
  id: z.string().describe("The id of the form"),
})
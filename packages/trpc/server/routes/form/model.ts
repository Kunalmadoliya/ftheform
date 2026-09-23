import {z} from "zod"

export const createInitialFormInput = z.object({ 
  title: z.string().min(1).describe("The title of the form"),
  description: z.string().optional().describe("The description of the form"),
});

export const createInitialFormOutput = z.object({
  id: z.string().describe("The id of the form"),
})

export const getFormByIdInput = z.object({
  formId: z.string().describe("The id of the form"),
});

export const getFormByIdOutput = z.object({
  id: z.string().describe("The id of the form"),
  title: z.string().describe("The title of the form"),
  description: z.string().nullable().optional().describe("The description of the form"),
  formUrl: z.string().nullable().optional().describe("The URL of the form"),
  isPublished: z.boolean().describe("Whether the form is published"),
  createdAt: z.date().describe("The date the form was created"),
});
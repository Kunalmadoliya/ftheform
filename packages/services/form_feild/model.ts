import {z} from "zod";

export const createFormField = z.object({
    formId: z.string().describe("form id"),
    type: z.string().describe("form field type"),
    category: z.string().describe("form field category"),
    label: z.string().describe("form field label"),
    required: z.boolean().default(false).describe("whether the form field is required"),
    fieldOrder: z.number().int().describe("the order of the form field"),   
    config: z.object({
        options: z.array(z.string()).optional().describe("options for selection fields"),
        placeholder: z.string().optional().describe("placeholder text for input fields"),
    }).strict(),
 })


export const listFormFields = z.object({
    formId: z.string().describe("form id"),
    userId : z.string().describe("user id"),
})

export type ListFormFieldsType = z.infer<typeof listFormFields>;
 export type CreateFormFieldType = z.infer<typeof createFormField>;
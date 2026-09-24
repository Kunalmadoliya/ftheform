import {z} from "zod";

export const signInInput = z.object({
  email: z.string().email().describe("The email of the user"),
  password: z.string().min(8).describe("The password of the user"),
});


export const signUpInput = z.object({
  email: z.string().email().describe("The email of the user"),
  password: z.string().min(8).describe("The password of the user"),
  name: z.string().min(1).describe("The name of the user"),
});

export type SignUpInputType = z.infer<typeof signUpInput>;
export type SignInInputType = z.infer<typeof signInInput>;

export const updateFormResponseLimit = z.object({
  formId: z.string().describe("form id"),
  userRole: z.string().describe("user role"),
  responseLimit: z.number().int().min(1).describe("new form response limit"),
});

export type UpdateFormResponseLimitType = z.infer<typeof updateFormResponseLimit>;
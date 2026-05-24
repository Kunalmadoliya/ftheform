import { z } from "zod";

export const createUserWithEmailAndPasswordInputModel = z.object({
  fullName: z.string().describe("User's full name"),
  email: z.email().describe("User's email"),
  password: z.string().describe("User's password"),
});

export const createUserWithEmailAndPasswordOutputModel = z.object({
  id: z.string().uuid().describe("ID of the user"),
});

export const signInUserWithEmailAndPasswordInputModel = z.object({
  email: z.email().describe("User's email"),
  password: z.string().describe("User's password"),
});

export const signInUserWithEmailAndPasswordOutputModel = z.object({
  id: z.string().uuid().describe("ID of the user"),
});


export const getLoggedInUserInfoInput = z.undefined();

export const getLoggedInUserInfoOutputModel = z.object({
  id: z.string().describe("ID of the user"),
  email: z.email().describe("User's email"),
  fullName: z.string().describe("User's full name"),
}); 

export const logoutUserOutputModel = z.object({
  success: z.boolean(),
  message: z.string(),
});
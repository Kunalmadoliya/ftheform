import { z } from "zod";


export const createUserWithEmailAndPasswordInputModel = z.object({
  fullName: z.string().describe("User's full name"),
  email: z.email().describe("User's email"),
  password: z.string().describe("User's password"),
});

export const createUserWithEmailAndPasswordOutputModel = z.object({
  id: z.string().uuid().describe('ID of the user'),
});

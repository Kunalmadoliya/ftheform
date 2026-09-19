import { publicProcedure, router } from "../../trpc";
import { signInInput, signUpInput, signInOutput, signUpOutput } from "./model";
import { authServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const signInPath = generatePath("/"); // yeh function return kar raha hai
const signUpPath = generatePath("");
const TAGS = ["Authentication"];

export const authRouter = router({
  signIn: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: signInPath("/sign-in/email"), // 👈 dubara call karo
        tags: TAGS,
      },
    })
    .input(signInInput)
    .output(signInOutput) // yeh function return kar raha hai
    .mutation(async ({ input }) => {
      return authServiceInstance.signIn(input);
    }),

  signUp: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: signUpPath("/sign-up/email"), // 👈 dubara call karo
        tags: TAGS,
      },
    })
    .input(signUpInput)
    .output(signUpOutput)
    .mutation(async ({ input }) => {
      return authServiceInstance.signUp(input);
    }),
});

export type AuthRouter = typeof authRouter;

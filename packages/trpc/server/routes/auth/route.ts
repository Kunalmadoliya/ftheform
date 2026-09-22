import { publicProcedure, router } from "../../trpc";
import {
  signInInput,
  signUpInput,
  signInOutput,
  signUpOutput
} from "./model";
import { authServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const signInPath = generatePath("/");
const signUpPath = generatePath("/");

const TAGS = ["Authentication"];

export const authRouter = router({
  signIn: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: signInPath("/sign-in/email"),
        tags: TAGS,
      },
    })
    .input(signInInput)
    .output(signInOutput)
    .mutation(async ({ input }) => {
      return authServiceInstance.signIn(input);
    }),

  signUp: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: signUpPath("/sign-up/email"),
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

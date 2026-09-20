import { publicProcedure, router } from "../../trpc";
import {
  signInInput,
  signUpInput,
  signInOutput,
  signUpOutput,
  googleSignInOutput,
  githubSignInOutput,
} from "./model";
import { authServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";

const signInPath = generatePath("/");
const signUpPath = generatePath("/");
const googleSignInPath = generatePath("/");
const githubSignInPath = generatePath("/");
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

  googleSignIn: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: googleSignInPath("/sign-in/google"),
        tags: TAGS,
      },
    })
    .output(googleSignInOutput)
    .mutation(async ({}) => {
      return authServiceInstance.googleSignIn();
    }),

  githubSignIn: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: githubSignInPath("/sign-in/github"),
        tags: TAGS,
      },
    })
    .output(githubSignInOutput)
    .mutation(async ({}) => {
      return authServiceInstance.githubSignIn();
    }),
});

export type AuthRouter = typeof authRouter;
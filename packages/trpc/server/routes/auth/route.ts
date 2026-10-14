import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
  signInInput,
  signUpInput,
  signInOutput,
  signUpOutput,
  currentUserRoleOutput,
} from "./model";
import { authServiceInstance } from "../../services";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const signInPath = generatePath("/");
const signUpPath = generatePath("/");

const TAGS = ["Authentication"];

export const authRouter = router({
  getCurrentUserRole: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: signInPath("/user-role"),
        tags: TAGS,
        protect: true,
      },
    })
    .output(currentUserRoleOutput)
    .query(({ ctx }) => {
      if (!ctx.userRole) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User role is unavailable" });
      }
      return { userRole: ctx.userRole };
    }),

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

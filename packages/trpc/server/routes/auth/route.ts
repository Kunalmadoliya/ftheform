import { userService } from "../../services";
import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { getAuthenticationCookie, setAuthenticationCookie } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel,
  signInUserWithEmailAndPasswordInputModel,
  signInUserWithEmailAndPasswordOutputModel,
  getLoggedInUserInfoInput,
  getLoggedInUserInfoOutputModel,
  logoutUserOutputModel,
} from "./model";
import { ApiError } from "@repo/api-responses/api-error";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/createUserWithEmailAndPassword"), tags: TAGS },
    })
    .input(createUserWithEmailAndPasswordInputModel)
    .output(createUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { fullName, email, password } = input;

      const { id, token } = await userService.createUserWithEmailAndPassword({
        fullName,
        email,
        password,
      });

      setAuthenticationCookie(ctx, token);

      return {
        id,
      };
    }),

  signInUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/signInUserWithEmailAndPassword"), tags: TAGS },
    })
    .input(signInUserWithEmailAndPasswordInputModel)
    .output(signInUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const { id, token } = await userService.signInUserWithEmailAndPassword({
        email,
        password,
      });

      setAuthenticationCookie(ctx, token);

      return {
        id,
      };
    }),

  getLoggedInUserInfo: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getLoggedInUserInfo"),
        tags: TAGS,
        protect : true
      },
    })
    .input(getLoggedInUserInfoInput)
    .output(getLoggedInUserInfoOutputModel)
    .query(async ({ ctx }) => {
      const user = await userService.getUserInfoByID(ctx.user.id)

      if (!user) {
        throw ApiError.unauthorized("Unauthorized")
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      };
    }),

  logoutUser: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/logoutUser"),
        tags: TAGS,
      },
    })
    .output(logoutUserOutputModel)
    .mutation(async ({ ctx }) => {
      const userToken = getAuthenticationCookie(ctx);

      if (!userToken) {
        throw ApiError.unauthorized("Unauthorized");
      }

      ctx.clearCookie("authentication-token");

      return {
        success: true,
        message: "User logged out successfully",
      };
    }),
});

import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { ApiError } from "@repo/api-responses/api-error";

import { getAuthenticationCookie } from "./utils/cookie";
import { userService } from "./services";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authenticatedProcedure = tRPCContext.procedure.use(async options => {
  const { ctx } = options;
  const userToken = getAuthenticationCookie(ctx);

  if (!userToken) {
    throw ApiError.unauthorized("Unauthorized");
  }
  const { id } = await userService.verifyDecodedUser(userToken);

  return options.next({
    ctx: {
      ...ctx,
      user: {
        id,
      },
    },
  });
});

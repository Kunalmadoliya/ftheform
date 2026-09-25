import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure

export const protectedProcedure = tRPCContext.procedure.use(async (options) => {
  const { ctx } = options

  const session = ctx.session
  const user =  ctx.user
  const userId = ctx.userId

  
  if (!session || !user || !userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return options.next({
    ctx: {
      ...ctx,
      session,
      user,
      userId,
    },
  });
});

export const authenticatedProcedure = protectedProcedure;



//for protected and authicated user routes

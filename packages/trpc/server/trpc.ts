import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authenticatedProcedure = tRPCContext.procedure.use(async (options) => {
  const { ctx } = options

  const session = ctx.session
  const user =  ctx.user

  
  if (!session || !user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return options.next({
    ctx: {
      ...ctx,
      session,
      user
      ,
    },
  });
});



//for protected and authicated user routes

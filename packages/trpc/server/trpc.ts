import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { OpenApiMeta } from "trpc-to-openapi";
import { logger } from "@repo/logger";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

const sanitizedErrors = tRPCContext.middleware(async ({ next }) => {
  const result = await next();
  if (result.ok) return result;

  if (result.error.cause instanceof ZodError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid request" });
  }
  if (result.error.code === "INTERNAL_SERVER_ERROR") {
    if (result.error.cause) {
      logger.error("Unhandled API error", { error: result.error.cause });
    }
    const safeMessage =
      result.error.message && result.error.message !== "INTERNAL_SERVER_ERROR"
        ? result.error.message
        : "An unexpected server error occurred.";
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: safeMessage,
    });
  }
  return result;
});

export const publicProcedure = tRPCContext.procedure.use(sanitizedErrors);

export const protectedProcedure = publicProcedure.use(async (options) => {
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

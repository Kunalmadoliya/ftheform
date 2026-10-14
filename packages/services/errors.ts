import { TRPCError, type TRPC_ERROR_CODE_KEY } from "@trpc/server";

export function serviceError(code: TRPC_ERROR_CODE_KEY, message: string) {
  return new TRPCError({ code, message });
}

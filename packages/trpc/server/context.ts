import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "@repo/database/lib/auth";

type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface ContextUser {
  session: SessionResponse["session"] | null;
  user: SessionResponse["user"] | null;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<ContextUser> {
  const authSession = await auth.api.getSession({
    headers: new Headers(req.headers as Record<string, string>),
  });

  return {
    session: authSession?.session ?? null,
    user: authSession?.user ?? null,
  };
}
export type Context = ContextUser;

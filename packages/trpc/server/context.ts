import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "@repo/database/lib/auth";

type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface ContextUser {
  session: SessionResponse["session"] | null;
  user: SessionResponse["user"] | null;
  userId: string | null;
  userRole: string | null;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<ContextUser> {
  const authSession = await auth.api.getSession({
    headers: new Headers(req.headers as Record<string, string>),
  });
  const userId = authSession?.user.id ?? null;

  return {
    session: authSession?.session ?? null,
    user: authSession?.user ?? null,
    userId,
    userRole: authSession?.user.role ?? null,
  };
}
export type Context = ContextUser;

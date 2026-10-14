import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "@repo/database/lib/auth";
import { createHmac, timingSafeEqual } from "node:crypto";

type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

const respondentCookieName = "respondent";
const respondentCookieMaxAge = 60 * 60 * 24 * 365;
const respondentIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respondentSignature(id: string, issuedAt: number) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to sign respondent cookies");
  return createHmac("sha256", secret)
    .update(`ftheform:respondent:v1:${id}:${issuedAt}`)
    .digest("base64url");
}

function readRespondentId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookieValues = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${respondentCookieName}=`));
  if (cookieValues.length !== 1) return null;

  const value = cookieValues[0]?.slice(respondentCookieName.length + 1);
  if (!value) return null;
  const [version, id, issuedAtValue, signature, ...extra] = value.split(".");
  if (
    version !== "v1" ||
    !id ||
    !respondentIdPattern.test(id) ||
    !issuedAtValue ||
    !signature ||
    extra.length > 0
  ) {
    return null;
  }
  const issuedAt = Number(issuedAtValue);
  const now = Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 60 ||
    now - issuedAt >= respondentCookieMaxAge
  ) {
    return null;
  }
  const expected = Buffer.from(respondentSignature(id, issuedAt));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return id;
}

export interface ContextUser {
  session: SessionResponse["session"] | null;
  user: SessionResponse["user"] | null;
  userId: string | null;
  userRole: string | null;
  respondentId: string | null;
  setRespondentCookie: (respondentId: string) => void;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<ContextUser> {
  const authSession = await auth.api.getSession({
    headers: new Headers(req.headers as Record<string, string>),
  });
  const userId = authSession?.user.id ?? null;
  const respondentId = readRespondentId(req.headers.cookie);

  function setRespondentCookie(id: string) {
    if (!respondentIdPattern.test(id)) {
      throw new Error("Cannot set an invalid respondent identifier");
    }
    const issuedAt = Math.floor(Date.now() / 1000);
    const value = `v1.${id}.${issuedAt}.${respondentSignature(id, issuedAt)}`;
    const forwardedProto = req.headers["x-forwarded-proto"];
    const firstForwardedProto = Array.isArray(forwardedProto)
      ? forwardedProto[0]?.split(",")[0]?.trim()
      : forwardedProto?.split(",")[0]?.trim();
    const requestUsesHttps =
      req.secure ||
      firstForwardedProto === "https" ||
      process.env.BASE_URL?.startsWith("https://");
    const secure =
      process.env.NODE_ENV === "production" && requestUsesHttps ? "; Secure" : "";
    const cookie = `${respondentCookieName}=${value}; Max-Age=${respondentCookieMaxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`;
    const existing = res.getHeader("Set-Cookie");
    res.setHeader("Set-Cookie", existing
      ? [...(Array.isArray(existing) ? existing : [String(existing)]), cookie]
      : cookie);
  }

  return {
    session: authSession?.session ?? null,
    user: authSession?.user ?? null,
    userId,
    userRole: authSession?.user.role ?? null,
    respondentId,
    setRespondentCookie,
  };
}
export type Context = ContextUser;

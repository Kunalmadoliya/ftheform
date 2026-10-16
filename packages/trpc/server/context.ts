import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "@repo/database/lib/auth";
import { env } from "@repo/database/env";
import { fromNodeHeaders } from "better-auth/node";
import { createHmac, timingSafeEqual } from "node:crypto";

type SessionResponse = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

const respondentCookieName = "respondent";
const respondentCookieMaxAge = 60 * 60 * 24 * 365;
const respondentIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respondentSignature(id: string, issuedAt: number) {
  const secret = process.env.RESPONDENT_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("RESPONDENT_COOKIE_SECRET must contain at least 32 characters");
  }
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
    headers: fromNodeHeaders(req.headers),
  });
  const userId = authSession?.user.id ?? null;
  const respondentId = readRespondentId(req.headers.cookie);

  function setRespondentCookie(id: string) {
    if (!respondentIdPattern.test(id)) {
      throw new Error("Cannot set an invalid respondent identifier");
    }
    const issuedAt = Math.floor(Date.now() / 1000);
    const value = `v1.${id}.${issuedAt}.${respondentSignature(id, issuedAt)}`;
    // Always use SameSite=Lax: requires the web app and API to share the same
    // registrable domain. The Secure flag is derived from BASE_URL's protocol,
    // not from NODE_ENV, so it works correctly in any HTTPS environment.
    const secureCookie = new URL(env.BASE_URL).protocol === "https:";
    const cookie = `${respondentCookieName}=${value}; Max-Age=${respondentCookieMaxAge}; Path=/; HttpOnly; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
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

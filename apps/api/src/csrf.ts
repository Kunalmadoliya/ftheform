/**
 * csrf.ts — Origin-based CSRF defense middleware.
 *
 * For every state-changing request (POST, PUT, PATCH, DELETE) on paths that
 * belong to /trpc or /api — except /api/inngest and Better Auth's OAuth
 * callback paths — we verify that the Origin header (or Referer as fallback)
 * matches one of the trusted origins derived from env.
 *
 * This is the standard "same-origin with standard headers" CSRF check
 * described at https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 * It works because browsers always send Origin for cross-origin requests and
 * for POST requests from forms; for same-origin requests no CSRF risk exists.
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "@repo/logger";

/** Methods that must carry an Origin or Referer header we can verify. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Path prefixes that are exempt from CSRF checking.
 *
 * - /api/inngest — Inngest webhook: authenticated via HMAC signing key, not cookies.
 * - /api/auth/callback — Better Auth OAuth callbacks: these come from the IdP,
 *   not from a browser form, and they carry an authorization_code, not a cookie.
 */
const EXEMPT_PREFIXES = ["/api/inngest", "/api/auth/callback"];

/**
 * Returns an Express middleware that enforces CSRF origin checks on
 * /trpc and /api routes (except exempt prefixes).
 *
 * @param trustedOrigins - Normalised list of allowed origins (no trailing slash).
 */
export function createCsrfMiddleware(trustedOrigins: string[]) {
  const allowedSet = new Set(trustedOrigins.map((o) => o.toLowerCase()));

  return function csrfMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    // Only check unsafe methods.
    if (!UNSAFE_METHODS.has(req.method)) {
      return next();
    }

    // Only check our own API/tRPC paths.
    const path = req.path;
    if (!path.startsWith("/trpc") && !path.startsWith("/api")) {
      return next();
    }

    // Exempt Inngest and OAuth callback paths.
    for (const prefix of EXEMPT_PREFIXES) {
      if (path.startsWith(prefix)) {
        return next();
      }
    }

    // Extract the Origin header; fall back to the Referer origin.
    let requestOrigin: string | null = null;

    const originHeader = req.headers["origin"];
    if (originHeader && originHeader !== "null") {
      try {
        requestOrigin = new URL(originHeader).origin.toLowerCase();
      } catch {
        requestOrigin = null;
      }
    }

    if (!requestOrigin) {
      const refererHeader = req.headers["referer"];
      if (refererHeader) {
        try {
          requestOrigin = new URL(refererHeader).origin.toLowerCase();
        } catch {
          requestOrigin = null;
        }
      }
    }

    if (!requestOrigin) {
      // No verifiable origin — deny.
      logger.warn(
        `CSRF: request has no Origin or Referer header — rejected (${req.method} ${path})`,
      );
      res.status(403).json({ error: "CSRF check failed: missing origin" });
      return;
    }

    if (!allowedSet.has(requestOrigin)) {
      logger.warn(
        `CSRF: untrusted origin rejected (${req.method} ${path}) — origin=${requestOrigin} allowedOrigins=${[...allowedSet].join(",")}`,
      );
      res.status(403).json({ error: "CSRF check failed: untrusted origin" });
      return;
    }

    return next();
  };
}

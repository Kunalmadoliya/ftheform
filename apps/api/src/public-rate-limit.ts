import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";

const publicProcedures = new Set([
  "form.getPublicFormById",
  "form.incrementFormViewCount",
  "formSnapshot.getLatestSnapshot",
  "submission.startSubmission",
  "submission.getActiveSubmission",
  "submission.updateDraftAnswer",
  "submission.updateLastActivity",
  "submission.submitForm",
  "submission.markNotSubmitted",
  "submission.checkVersionMismatch",
  "submission.deleteSubmission",
  "answer.saveAnswer",
  "answer.saveBulkAnswers",
]);

const publicOpenApiRoutes: Array<{ method: string; path: RegExp }> = [
  { method: "GET", path: /^\/form\/public\/[^/]+$/ },
  { method: "POST", path: /^\/form\/[^/]+\/view$/ },
  { method: "GET", path: /^\/form\/[^/]+\/snapshots\/latest$/ },
  { method: "POST", path: /^\/submission\/start$/ },
  { method: "GET", path: /^\/submission\/active\/[^/]+$/ },
  { method: "PATCH", path: /^\/submission\/[^/]+\/draft$/ },
  { method: "PATCH", path: /^\/submission\/[^/]+\/activity$/ },
  { method: "POST", path: /^\/submission\/[^/]+\/submit$/ },
  { method: "POST", path: /^\/submission\/[^/]+\/not-submitted$/ },
  { method: "GET", path: /^\/submission\/[^/]+\/version$/ },
  { method: "DELETE", path: /^\/submission\/[^/]+$/ },
  { method: "POST", path: /^\/answer\/?$/ },
  { method: "PUT", path: /^\/answer\/bulk$/ },
];

export function isPublicRateLimitedPath(path: string) {
  return path
    .split(",")
    .some((procedure) => publicProcedures.has(procedure.replace(/^\/+/, "").split("?")[0] ?? ""));
}

export function isPublicOpenApiRateLimitedRequest(method: string, path: string) {
  const normalizedPath = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  return publicOpenApiRoutes.some((route) => route.method === method && route.path.test(normalizedPath));
}

export function createPublicProcedureRateLimit(options?: { limit?: number; windowMs?: number }) {
  const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: options?.windowMs ?? 60_000,
    limit: options?.limit ?? 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const isRateLimited = req.baseUrl === "/api"
      ? isPublicOpenApiRateLimitedRequest(req.method, req.path)
      : isPublicRateLimitedPath(req.path);
    if (isRateLimited) return limiter(req, res, next);
    return next();
  };
}

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

export function isPublicRateLimitedPath(path: string) {
  return path
    .split(",")
    .some((procedure) => publicProcedures.has(procedure.replace(/^\/+/, "").split("?")[0] ?? ""));
}

export function createPublicProcedureRateLimit(options?: { limit?: number; windowMs?: number }) {
  const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: options?.windowMs ?? 60_000,
    limit: options?.limit ?? 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    if (isPublicRateLimitedPath(req.path)) return limiter(req, res, next);
    return next();
  };
}

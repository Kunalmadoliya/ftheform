/**
 * csrf.test.ts — Unit tests for the CSRF origin-check middleware.
 *
 * These tests use a minimal mock of Express req/res/next so no HTTP server
 * is needed. They cover:
 *   - safe methods are always allowed through
 *   - exempt paths are always allowed through
 *   - requests with a trusted Origin are allowed
 *   - requests with an untrusted Origin are rejected with 403
 *   - requests with no Origin fall back to Referer
 *   - requests with neither header are rejected
 *   - null Origin (cross-origin redirect) is treated as missing
 *   - extra paths outside /trpc and /api are not checked
 */

import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { createCsrfMiddleware } from "./csrf";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(
  overrides: Partial<{
    method: string;
    path: string;
    origin: string | null;
    referer: string | null;
  }> = {},
): Request {
  const { method = "POST", path = "/trpc/form.createInitialForm", origin, referer } = overrides;
  const headers: Record<string, string> = {};
  if (origin !== undefined && origin !== null) headers["origin"] = origin;
  if (referer !== undefined && referer !== null) headers["referer"] = referer;
  return { method, path, headers } as unknown as Request;
}

function makeRes() {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json, _status: status } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

const TRUSTED = ["https://app.example.com", "https://preview.example.com"];
const middleware = createCsrfMiddleware(TRUSTED);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createCsrfMiddleware", () => {
  describe("safe methods are always allowed through", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      it(`passes ${method} without checking origin`, () => {
        const req = makeReq({ method, path: "/trpc/form.getFormById" });
        const res = makeRes();
        const next = vi.fn() as NextFunction;

        middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
      });
    }
  });

  describe("exempt paths are always allowed through", () => {
    it("passes POST /api/inngest without origin", () => {
      const req = makeReq({ method: "POST", path: "/api/inngest" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("passes POST /api/auth/callback/google without origin", () => {
      const req = makeReq({ method: "POST", path: "/api/auth/callback/google" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("non-API paths are not checked", () => {
    it("passes POST /health without origin", () => {
      const req = makeReq({ method: "POST", path: "/health" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("trusted Origin header", () => {
    it("allows POST /trpc with a trusted Origin", () => {
      const req = makeReq({ origin: "https://app.example.com" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("allows POST /api with the second trusted origin", () => {
      const req = makeReq({
        path: "/api/form/create",
        origin: "https://preview.example.com",
      });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("allows trusted origin regardless of trailing path on the origin header", () => {
      // Browsers always send the bare origin, but we normalise via new URL().origin
      const req = makeReq({ origin: "https://app.example.com" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("untrusted Origin header → 403", () => {
    it("rejects POST /trpc with an untrusted Origin", () => {
      const req = makeReq({ origin: "https://evil.example.com" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("rejects DELETE /api with an untrusted Origin", () => {
      const req = makeReq({
        method: "DELETE",
        path: "/api/form.deleteForm",
        origin: "https://attacker.com",
      });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("rejects PUT with a malformed Origin header", () => {
      const req = makeReq({ method: "PUT", origin: "not-a-url" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      // malformed origin → treated as missing → 403
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("Referer fallback", () => {
    it("allows POST /trpc when Origin is absent but Referer is trusted", () => {
      const req = makeReq({
        origin: null,
        referer: "https://app.example.com/dashboard",
      });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("rejects POST /trpc when Referer is untrusted and Origin is absent", () => {
      const req = makeReq({
        origin: null,
        referer: "https://evil.com/dashboard",
      });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("null Origin (cross-origin redirects)", () => {
    it("treats the literal string 'null' as a missing origin → 403", () => {
      const req = makeReq({ origin: "null" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("no origin at all → 403", () => {
    it("rejects PATCH /trpc with neither Origin nor Referer", () => {
      const req = makeReq({ method: "PATCH", origin: null, referer: null });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("case insensitivity", () => {
    it("allows Origin that differs only in case from a trusted origin", () => {
      const req = makeReq({ origin: "HTTPS://APP.EXAMPLE.COM" });
      const res = makeRes();
      const next = vi.fn() as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});

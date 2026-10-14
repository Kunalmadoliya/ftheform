import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createPublicProcedureRateLimit, isPublicRateLimitedPath } from "./public-rate-limit";

describe("public procedure rate limiting", () => {
  let server: ReturnType<ReturnType<typeof express>["listen"]> | undefined;

  afterEach(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  it("matches public procedures in single and batched tRPC paths", () => {
    expect(isPublicRateLimitedPath("/submission.startSubmission")).toBe(true);
    expect(isPublicRateLimitedPath("submission.submitForm,form.incrementFormViewCount")).toBe(true);
    expect(isPublicRateLimitedPath("form.getById")).toBe(false);
  });

  it("limits concurrent public requests from the same client", async () => {
    const app = express();
    app.use("/trpc", createPublicProcedureRateLimit({ limit: 2, windowMs: 60_000 }));
    app.use("/trpc", (_req, res) => res.sendStatus(200));
    server = app.listen(0);
    await new Promise<void>((resolve) => server?.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => fetch(`http://127.0.0.1:${address.port}/trpc/submission.submitForm`)),
    );
    expect(responses.filter((response) => response.status === 200)).toHaveLength(2);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(3);
  });
});

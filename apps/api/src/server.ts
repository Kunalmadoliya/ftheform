import express from "express";
import { logger } from "@repo/logger";
import { auth } from "@repo/database/lib/auth";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { parse as parseDomain } from "tldts";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { serve as serveInngest } from "inngest/express";
import {
  clearExpiredFormGenerationPromptsFunction,
  failStaleFormGenerationJobsFunction,
  generateFormFieldsFunction,
} from "@repo/services/form_ai/functions";
import { expireInactiveSubmissionsFunction } from "@repo/services/form_submission/functions";
import { inngest } from "@repo/services/form_ai/inngest-client";
import { createPublicProcedureRateLimit } from "./public-rate-limit";
import { createCsrfMiddleware } from "./csrf";
import { handleRazorpayWebhook } from "@repo/services/payment";

import { env } from "./env";

// ---------------------------------------------------------------------------
// Same-site domain check (Goal 3)
// Compare the registrable domains of WEB_URL and BASE_URL using the PSL.
// If they differ, SameSite=Lax cookies will not be sent cross-site, and
// the application will not work correctly. Log a loud warning — do not crash.
// ---------------------------------------------------------------------------
(function checkSameSiteDomains() {
  const webDomain = parseDomain(new URL(env.WEB_URL).hostname);
  const apiDomain = parseDomain(new URL(env.BASE_URL).hostname);

  const webReg = webDomain?.domain ?? null;
  const apiReg = apiDomain?.domain ?? null;

  // Localhost / IP addresses: domain will be null — that is fine for development.
  if (webReg === null && apiReg === null) return;

  if (webReg !== apiReg) {
    logger.warn(
      "⚠️  WEB_URL and BASE_URL have different registrable domains. " +
        "SameSite=Lax cookies will NOT be sent by the browser for cross-site requests. " +
        "Authentication and respondent cookies will not work unless WEB_URL and BASE_URL " +
        `share the same registrable domain (e.g. app.example.com + api.example.com). ` +
        `WEB_URL=${env.WEB_URL} (domain: ${webReg}) BASE_URL=${env.BASE_URL} (domain: ${apiReg}). ` +
        "Set TRUSTED_ORIGINS and ensure both use the same base domain, or proxy through a common domain.",
    );
  }
})();

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FTHEFORM",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

// ---------------------------------------------------------------------------
// CORS — allow all trusted origins (WEB_URL + any TRUSTED_ORIGINS entries).
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.trustedOrigins,
    credentials: true,
  }),
// ---------------------------------------------------------------------------
// Better Auth route MUST be mounted before express.json(),
// since toNodeHandler needs the raw, unparsed request stream.
// ---------------------------------------------------------------------------
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// ---------------------------------------------------------------------------
// Razorpay Webhook: Mounted with express.raw() BEFORE express.json()
// and BEFORE CSRF / Rate limiting / OpenAPI /api mount.
// ---------------------------------------------------------------------------
app.post(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body || "");
      const result = await handleRazorpayWebhook(
        rawBody,
        req.headers["x-razorpay-signature"],
      );
      return res.status(result.status).json(result.body);
    } catch (error) {
      logger.error("Unhandled error processing Razorpay webhook", { error });
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// JSON parser for every other route, after the auth and raw webhook handlers
app.use(express.json({ limit: "256kb" }));

// ---------------------------------------------------------------------------
// CSRF defense (Goal 4)
// Applies to POST/PUT/PATCH/DELETE on /trpc and /api except:
//   - /api/inngest (authenticated by Inngest HMAC signing key)
//   - /api/auth/callback/* (OAuth IdP callbacks — no cookie, no CSRF risk)
// ---------------------------------------------------------------------------
app.use(createCsrfMiddleware(env.trustedOrigins));

app.use(
  `/api/inngest`,
  serveInngest({
    client: inngest,
    functions: [
      generateFormFieldsFunction,
      failStaleFormGenerationJobsFunction,
      clearExpiredFormGenerationPromptsFunction,
      expireInactiveSubmissionsFunction,
    ],
  }),
);




app.get("/", (req, res) => {
  return res.json({ message: "FTHEFORM API is up and running." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "FTHEFORM API is healthy.", healthy: true });
});


app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
if (env.NODE_ENV === "development") {
  app.use("/docs", apiReference({ url: "/openapi.json" }));
} else {
  app.use("/docs", (_req, res) => res.sendStatus(404));
}

app.use(
  "/api",
  createPublicProcedureRateLimit(),
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  createPublicProcedureRateLimit(),
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;

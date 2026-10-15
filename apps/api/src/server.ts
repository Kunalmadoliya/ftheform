import express from "express";
import { logger } from "@repo/logger";
import { auth } from "@repo/database/lib/auth";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

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

import { env } from "./env";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FTHEFORM",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);

// 👇 better-auth route MUST be mounted before express.json(),
// since toNodeHandler needs the raw, unparsed request stream.
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// JSON parser for every other route, after the auth handler
app.use(express.json({ limit: "256kb" }));
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

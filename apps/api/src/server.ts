import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { env } from "./env";

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FTHEFORM OpenAPI",
  version: "1.0.0",
  baseUrl: `${env.BASE_URL}/api`,
});

// CORS for development only
if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: "*",
    }),
  );
}

app.use(express.json());

// Root route
app.get("/", (_req, res) => {
  return res.status(200).json({
    name: "FTHEFORM",
    message: "FTHEFORM server is up and running",
  });
});

// Health check
app.get("/health", (_req, res) => {
  return res.status(200).json({
    service: "FTHEFORM",
    healthy: true,
    message: "FTHEFORM server is healthy",
  });
});

// OpenAPI JSON
logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_req, res) => {
  return res.status(200).json(openApiDocument);
});

// API Docs
logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

// REST API
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

// tRPC API
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
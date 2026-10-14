import OpenAI from "openai";
import { serviceError } from "../errors";
import { env } from "../env";

let client: OpenAI | undefined;

export function getOpenAiClient() {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw serviceError("INTERNAL_SERVER_ERROR", "AI form generation is not configured.");
  }

  client ??= new OpenAI({
    apiKey,
    timeout: 45_000,
    maxRetries: 2,
  });
  return client;
}

export function isOpenAiConfigurationError(error: unknown) {
  return error instanceof OpenAI.APIError && [400, 401, 403, 404].includes(error.status ?? 0);
}
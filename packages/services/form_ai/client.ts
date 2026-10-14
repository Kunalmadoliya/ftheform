import OpenAI from "openai";
import { serviceError } from "../errors";

let client: OpenAI | undefined;

export function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
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
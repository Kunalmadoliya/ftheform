import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI form generation is not configured: OPENAI_API_KEY is missing.");
  }

  client ??= new OpenAI({
    apiKey,
    timeout: 45_000,
    maxRetries: 2,
  });
  return client;
}
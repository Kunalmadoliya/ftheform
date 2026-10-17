import { serviceError } from "../errors";
import type { GeneratedFormResult } from "./model";

export class NonFormRequestError extends Error {
  constructor(message = "I can only help create forms. Please describe the form you want.") {
    super(message);
    this.name = "NonFormRequestError";
  }
}

// In-memory rate limiter: max 5 requests per 60 seconds per user
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(userId: string, limit = 5, windowMs = 60_000): void {
  if (!userId) return;
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (record && now < record.resetAt) {
    if (record.count >= limit) {
      throw serviceError(
        "TOO_MANY_REQUESTS",
        "You are generating forms too quickly. Please wait a moment before trying again.",
      );
    }
    record.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
  }

  // Periodic cleanup of stale records
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now >= val.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// Clear rate limits (for test isolation)
export function _resetRateLimits(): void {
  rateLimitMap.clear();
}

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:the\s+above|previous)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:the\s+above|previous(\s+instructions)?)/i,
  /(?:reveal|output|show|print|tell\s+me|what\s+is|display|give\s+me)\s+(?:all\s+)?(?:the\s+|your\s+)?system\s+prompt/i,
  /\bjailbreak\b/i,
  /\bdan\s+mode\b/i,
  /\bdo\s+anything\s+now\b/i,
  /(?:override|bypass|forget)\s+(?:all\s+)?(?:previous\s+)?(?:rules|instructions)/i,
  /<\s*\/?\s*(?:script|iframe|object|embed|style|html|body|head|link|meta|applet|form|input|button|div|span|p|a|img|svg|table|tr|td)\b[^>]*>/i,
  /<\s*script\b/i,
  /<\s*[^>]*(?:on\w+\s*=|javascript:)[^>]*>/i,
];

export function checkPromptInjection(prompt: string): void {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      throw serviceError(
        "BAD_REQUEST",
        "I can only help create forms. Please describe the form you want.",
      );
    }
  }
}

export function checkGibberish(prompt: string): void {
  // Reject non-printable ASCII control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(prompt)) {
    throw serviceError("BAD_REQUEST", "Prompt contains invalid control characters.");
  }

  // Reject long strings of repeated non-whitespace characters (e.g., aaaaaaa, 1111111, !!!!!!!)
  if (/([^\s])\1{5,}/.test(prompt)) {
    throw serviceError("BAD_REQUEST", "Please provide a meaningful description for your form.");
  }

  // Reject prompts dominated by non-alphanumeric symbols
  const alphanumericCount = (prompt.match(/[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g) || []).length;
  if (prompt.length >= 8 && alphanumericCount / prompt.length < 0.35) {
    throw serviceError("BAD_REQUEST", "Please provide a clearer description with words.");
  }
}

export function validatePromptInput(prompt: string, userId?: string): string {
  const cleanPrompt = prompt.trim();

  if (cleanPrompt.length < 8) {
    throw serviceError("BAD_REQUEST", "Prompt must be at least 8 characters long.");
  }

  if (cleanPrompt.length > 1000) {
    throw serviceError("BAD_REQUEST", "Prompt cannot exceed 1000 characters.");
  }

  if (userId) {
    checkRateLimit(userId);
  }

  checkGibberish(cleanPrompt);
  checkPromptInjection(cleanPrompt);

  return cleanPrompt;
}

export function sanitizeText(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Strip style tags and content
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip control characters
    .trim();
}

export function sanitizeGeneratedForm(result: GeneratedFormResult): GeneratedFormResult {
  const rawTitle = result.title ? sanitizeText(result.title) : "";
  const title = (rawTitle.slice(0, 60).trim()) || "Untitled Form";

  const rawDescription = result.description ? sanitizeText(result.description) : "";
  const description = rawDescription.slice(0, 500).trim();

  const fields = (result.fields || []).slice(0, 20).map((field) => {
    const rawLabel = sanitizeText(field.label);
    const label = (rawLabel.slice(0, 120).trim()) || "Question";

    switch (field.type) {
      case "text":
      case "textarea":
      case "email": {
        const placeholder = field.config?.placeholder
          ? sanitizeText(field.config.placeholder).slice(0, 200)
          : undefined;
        return {
          ...field,
          label,
          ...(placeholder !== undefined ? { config: { placeholder } } : {}),
        };
      }
      case "select":
      case "multiselect": {
        let options = (field.config?.options || [])
          .filter((opt): opt is string => typeof opt === "string")
          .map((opt) => sanitizeText(opt).slice(0, 120))
          .filter((opt) => opt.length > 0)
          .slice(0, 20);
        if (options.length === 0) {
          options = ["Option 1", "Option 2"];
        }
        return {
          ...field,
          label,
          config: { options },
        };
      }
      case "number":
      case "rating":
      case "date":
      case "checkbox":
      default:
        return {
          ...field,
          label,
        };
    }
  });

  return {
    title,
    description,
    fields,
  };
}

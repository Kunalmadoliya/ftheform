import { logger } from "@repo/logger";
import { serviceError } from "../errors";
import { sendContactMail, type SendContactMailOptions } from "./mailer";
import type { SendMessageInput, SendMessageOutput } from "./model";

// ---------------------------------------------------------------------------
// Rate Limiter: max 3 contact messages per IP per hour
// ---------------------------------------------------------------------------
interface ContactIpRateLimit {
  count: number;
  resetAt: number;
}
const contactIpLimits = new Map<string, ContactIpRateLimit>();

export function checkContactRateLimit(
  ip: string,
  limit = 3,
  windowMs = 3600_000,
): void {
  const normalizedIp = ip?.trim() || "127.0.0.1";
  const now = Date.now();
  const record = contactIpLimits.get(normalizedIp);

  if (record && now < record.resetAt) {
    if (record.count >= limit) {
      logger.warn(`Contact rate limit exceeded for IP: ${normalizedIp}`);
      throw serviceError(
        "TOO_MANY_REQUESTS",
        "Too many messages sent from this network. Please try again later.",
      );
    }
    record.count++;
  } else {
    contactIpLimits.set(normalizedIp, { count: 1, resetAt: now + windowMs });
  }
}

export function _resetContactRateLimits(): void {
  contactIpLimits.clear();
}

// ---------------------------------------------------------------------------
// ContactService
// ---------------------------------------------------------------------------
export default class ContactService {
  public async sendMessage(
    input: SendMessageInput,
    clientIp: string,
    options?: {
      sendMailFn?: (opts: SendContactMailOptions) => Promise<void>;
      fetchFn?: typeof fetch;
    },
  ): Promise<SendMessageOutput> {
    // 1. Honeypot check: If filled, silently return success without sending
    if (input.honeypot && input.honeypot.trim().length > 0) {
      logger.info("Contact submission detected as bot via honeypot. Silently ignored.");
      return {
        success: true,
        message: "Thank you for reaching out. We will get back to you soon!",
      };
    }

    // 2. IP Rate limit check: 3 messages per IP per hour
    checkContactRateLimit(clientIp);

    // 3. Forward email to CONTACT_EMAIL
    const sendMail = options?.sendMailFn || sendContactMail;
    try {
      await sendMail({
        name: input.name,
        email: input.email,
        message: input.message,
        fetchFn: options?.fetchFn,
      });
    } catch (err: unknown) {
      logger.error("Failed to deliver contact form message", { error: err });
      // Never expose SMTP or provider errors to the client
      throw serviceError(
        "INTERNAL_SERVER_ERROR",
        "Could not send your message, please try again",
      );
    }

    return {
      success: true,
      message: "Thank you for reaching out. We will get back to you soon!",
    };
  }
}

export const contactServiceInstance = new ContactService();

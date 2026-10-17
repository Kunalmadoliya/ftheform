import { logger } from "@repo/logger";
import { env } from "../env";

export interface SendContactMailOptions {
  name: string;
  email: string;
  message: string;
  contactEmail?: string;
  apiKey?: string;
  fromEmail?: string;
  fetchFn?: typeof fetch;
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in email bodies.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips carriage returns and newlines to prevent email header injection.
 */
export function sanitizeHeader(str: string): string {
  return str.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Isolated Contact Mailer using Resend HTTPS API.
 * Uses CONTACT_RESEND_API_KEY and CONTACT_FROM_EMAIL.
 * Never touches or reuses Better Auth's internal email code.
 */
export async function sendContactMail(options: SendContactMailOptions): Promise<void> {
  const contactEmail =
    options.contactEmail || process.env.CONTACT_EMAIL || env.CONTACT_EMAIL;
  const apiKey =
    options.apiKey ||
    process.env.CONTACT_RESEND_API_KEY ||
    env.CONTACT_RESEND_API_KEY;
  const fromEmail =
    options.fromEmail ||
    process.env.CONTACT_FROM_EMAIL ||
    env.CONTACT_FROM_EMAIL ||
    "onboarding@resend.dev";

  if (!contactEmail) {
    logger.error("Contact mailer error: CONTACT_EMAIL is not configured.");
    throw new Error("Contact mailer not configured");
  }

  if (!apiKey) {
    logger.error("Contact mailer error: CONTACT_RESEND_API_KEY is not configured.");
    throw new Error("Contact mailer not configured");
  }

  const sanitizedName = sanitizeHeader(options.name);
  const subject = sanitizeHeader(`New Contact Form Message from ${sanitizedName}`);

  const escapedName = escapeHtml(sanitizedName);
  const escapedEmail = escapeHtml(options.email);
  const escapedMessageHtml = escapeHtml(options.message).replace(/\n/g, "<br/>");

  const textBody = `New Contact Form Message\n\nName: ${sanitizedName}\nEmail: ${options.email}\n\nMessage:\n${options.message}\n`;

  const htmlBody = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">New Contact Form Message</h2>
      <p><strong>Name:</strong> ${escapedName}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <h3 style="margin-bottom: 8px;">Message:</h3>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${escapedMessageHtml}
      </div>
    </div>
  `.trim();

  const fetchImplementation = options.fetchFn || globalThis.fetch;

  try {
    const response = await fetchImplementation("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contactEmail],
        reply_to: options.email,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error(`Resend API returned HTTP ${response.status}`, { details: errorText });
      throw new Error(`Resend rejected delivery with status ${response.status}`);
    }

    logger.info(`Contact message successfully delivered to ${contactEmail} via Resend HTTP API`);
  } catch (err: unknown) {
    logger.error("Failed to deliver contact email via Resend HTTP API", { error: err });
    throw err;
  }
}

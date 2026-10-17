import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@repo/logger";
import { env } from "../env";

export interface MailerConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
}

export interface SendContactMailOptions {
  name: string;
  email: string;
  message: string;
  contactEmail?: string;
  mailerConfig?: MailerConfig;
  transporterOverride?: Transporter;
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
 * Isolated Contact Mailer using Nodemailer SMTP.
 * Never touches existing Better Auth Resend email paths.
 */
export async function sendContactMail(options: SendContactMailOptions): Promise<void> {
  const contactEmail =
    options.contactEmail || process.env.CONTACT_EMAIL || env.CONTACT_EMAIL;
  const host =
    options.mailerConfig?.host || process.env.SMTP_HOST || env.SMTP_HOST;
  const user =
    options.mailerConfig?.user || process.env.SMTP_USER || env.SMTP_USER;
  const pass =
    options.mailerConfig?.pass || process.env.SMTP_PASS || env.SMTP_PASS;
  const from =
    options.mailerConfig?.from || process.env.SMTP_FROM || env.SMTP_FROM || user;
  const port =
    options.mailerConfig?.port ||
    Number(process.env.SMTP_PORT) ||
    env.SMTP_PORT ||
    465;
  const secure = options.mailerConfig?.secure ?? (port === 465);

  if (!contactEmail) {
    logger.error("Contact mailer error: CONTACT_EMAIL is not configured.");
    throw new Error("Contact mailer not configured");
  }

  if (!options.transporterOverride && (!host || !user || !pass)) {
    logger.error("Contact mailer error: SMTP credentials are not configured.");
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

  const transporter =
    options.transporterOverride ||
    nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

  try {
    await transporter.sendMail({
      to: contactEmail,
      from: from || user,
      replyTo: options.email,
      subject,
      text: textBody,
      html: htmlBody,
    });
    logger.info(`Contact message successfully forwarded to ${contactEmail}`);
  } catch (err: unknown) {
    logger.error("Failed to deliver contact email via SMTP", { error: err });
    throw err;
  }
}

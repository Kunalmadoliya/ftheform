import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "../env";
import * as schema from "../auth-schema";

import { db } from "../index";

// Build the list of trusted origins from WEB_URL and the optional TRUSTED_ORIGINS env var.
// TRUSTED_ORIGINS is a comma-separated list validated and normalised by env.ts.
function buildTrustedOrigins(): string[] {
  const extra = (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.includes("*"))
    .map((s) => {
      try {
        return new URL(s).origin;
      } catch {
        return null;
      }
    })
    .filter((s): s is string => s !== null);
  const set = new Set([env.WEB_URL, ...extra]);
  return Array.from(set);
}

// Derive the Secure cookie flag from the BASE_URL protocol, not from NODE_ENV.
// This works correctly when HTTPS is used in development (e.g. behind a local reverse proxy)
// and avoids hardcoding environment names in security-critical cookie attributes.
const secureCookie = new URL(env.BASE_URL).protocol === "https:";

export const auth = betterAuth({
  baseURL: env.BASE_URL,
  trustedOrigins: buildTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    // ... other plugins
    dash(),
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        const missing = [
          !env.RESEND_API_KEY ? "RESEND_API_KEY" : null,
          !env.EMAIL_FROM ? "EMAIL_FROM" : null,
        ]
          .filter(Boolean)
          .join(", ");
        console.error(
          `[auth] Cannot send verification email to ${user.email}: missing environment variable(s): ${missing}`,
        );
        throw new Error(
          `RESEND_API_KEY and EMAIL_FROM are required to send verification emails (missing: ${missing})`,
        );
      }
      const escapedUrl = url.replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character]!,
      );
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [user.email],
          subject: "Verify your FTHEFORM email",
          html: `<p>Confirm your email address to finish creating your FTHEFORM account.</p><p><a href="${escapedUrl}">Verify email</a></p>`,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(
          `[auth] Resend rejected verification email to ${user.email} (status ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Resend rejected the verification email request (${response.status}): ${errorText}`,
        );
      }
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    cookiePrefix: "ftheform",
    defaultCookieAttributes: {
      // Always use SameSite=Lax: requires that the web app and API share the same
      // registrable domain (e.g. example.com and api.example.com). Cross-site
      // (SameSite=None) cookies are intentionally not supported; see README.
      sameSite: "lax",
      // Secure is derived from BASE_URL's protocol so it works correctly
      // whether HTTPS is used in development, staging, or production.
      secure: secureCookie,
      httpOnly: true,
    },
  },
});

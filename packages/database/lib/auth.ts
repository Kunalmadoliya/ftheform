import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "../env";
import * as schema from "../auth-schema";

import { db } from "../index";

export const auth = betterAuth({
  baseURL: env.BASE_URL,
  trustedOrigins: [env.WEB_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
     autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
     sendOnSignUp: true,
     sendVerificationEmail: async ({ user, url }) => {
       if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
         throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send verification emails");
       }
       const escapedUrl = url.replace(/[&<>"']/g, (character) => ({
         "&": "&amp;",
         "<": "&lt;",
         ">": "&gt;",
         '"': "&quot;",
         "'": "&#39;",
       })[character]!);
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
         throw new Error(`Resend rejected the verification email request (${response.status})`);
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
  },
});

// apps/web/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { env } from "../env";
import { dashClient, sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL.replace(/\/trpc\/?$/, ""),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    dashClient(),
    sentinelClient({
      autoSolveChallenge: true, // Automatically solve PoW challenges
    }),
  ],
});

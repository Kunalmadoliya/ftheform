"use client";

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthForm, getAuthReturnPath } from "~/components/auth/auth-form";
import { authClient } from "~/lib/auth-client";
import { env } from "~/env";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      const returnPath = getAuthReturnPath(
        new URLSearchParams(window.location.search).get("next"),
        env.NEXT_PUBLIC_WEB_URL,
      );
      router.replace(returnPath);
    }
  }, [isPending, router, session]);

  if (isPending || session?.user) return null;
  return <AuthForm mode="login" />;
}

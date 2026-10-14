"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthForm } from "~/components/auth/auth-form";
import { authClient } from "~/lib/auth-client";
import { getAuthReturnPath } from "~/lib/auth-redirect";
import { env } from "~/env";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(getAuthReturnPath(
        new URLSearchParams(window.location.search).get("next"),
        env.NEXT_PUBLIC_WEB_URL,
      ));
    }
  }, [isPending, router, session]);

  if (isPending || session?.user) return null;
  return <AuthForm mode="sign-up" />;
}

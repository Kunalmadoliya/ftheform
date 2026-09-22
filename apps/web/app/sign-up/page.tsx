"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthForm } from "~/components/auth/auth-form";
import { authClient } from "~/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) router.replace("/dashboard");
  }, [isPending, router, session]);

  if (isPending || session?.user) return null;
  return <AuthForm mode="sign-up" />;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GitBranch, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";

type AuthMode = "login" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        setIsPending(false);
        return;
      }

      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect. Please try again.");
      setIsPending(false);
    }
  }

  async function handleSocialAuth(provider: "google" | "github") {
    setError("");
    setIsPending(true);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/dashboard`,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to connect. Please try again.");
        setIsPending(false);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_34%),radial-gradient(circle_at_85%_90%,color-mix(in_oklab,var(--chart-2)_13%,transparent),transparent_32%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground text-primary">
              <Sparkles className="size-4" />
            </span>
            FTHEFORM
          </Link>
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] opacity-70">Make room for better ideas</p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight">Turn a blank page into a clear next step.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 opacity-75">
              Build focused forms, gather thoughtful responses, and keep your work moving without the clutter.
            </p>
          </div>
          <p className="text-xs opacity-60">Simple tools for meaningful input.</p>
        </section>

        <section className="p-7 sm:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em]">
              <Sparkles className="size-4" />
              FTHEFORM
            </Link>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-medium text-muted-foreground">{isSignUp ? "Get started" : "Welcome back"}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Sign in to your workspace"}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isSignUp ? "Your next great form starts here." : "Pick up where you left off."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-11" disabled={isPending} onClick={() => handleSocialAuth("google")}>
                <span className="font-semibold">G</span>
                Google
              </Button>
              <Button type="button" variant="outline" className="h-11" disabled={isPending} onClick={() => handleSocialAuth("github")}>
                <GitBranch className="size-4" />
                GitHub
              </Button>
            </div>

            <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={handleEmailAuth}>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} className="pl-9" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="h-11 w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "New to FTHEFORM?"}{" "}
              <Link className="font-medium text-foreground underline underline-offset-4" href={isSignUp ? "/login" : "/sign-up"}>
                {isSignUp ? "Log in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

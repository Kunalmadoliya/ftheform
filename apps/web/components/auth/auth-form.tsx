"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Logo } from "~/components/brand/logo";
import { GoogleLogo, GithubLogo } from "~/components/icons/brand-icons";
import { IconEmail, IconPassword, IconSpinner, IconUser } from "~/components/icons/app-icons";
import { authClient } from "~/lib/auth-client";
import { getAuthCallbackUrl, getAuthPageHref, getAuthReturnPath } from "~/lib/auth-redirect";
import { env } from "~/env";

export { getAuthReturnPath } from "~/lib/auth-redirect";

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
  const [verificationSent, setVerificationSent] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next"));
  }, []);

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const callbackURL = getAuthCallbackUrl(nextPath, env.NEXT_PUBLIC_WEB_URL);
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password, callbackURL })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        setIsPending(false);
        return;
      }

      if (isSignUp) {
        setVerificationSent(true);
        setIsPending(false);
        return;
      }
      const returnPath = getAuthReturnPath(
        nextPath,
        env.NEXT_PUBLIC_WEB_URL,
      );
      router.replace(returnPath);
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
        callbackURL: getAuthCallbackUrl(
          nextPath,
          env.NEXT_PUBLIC_WEB_URL,
        ),
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

  if (verificationSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">One more step</p>
          <h1 className="mt-2 text-2xl font-semibold">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We sent a verification link to <strong className="text-foreground">{email}</strong>.
            Verify your email to finish creating your account.
          </p>
          <Link className="mt-6 inline-block font-mono text-xs underline underline-offset-4 hover:text-foreground" href={getAuthPageHref("/login", nextPath)}>
            Return to sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between border-r border-border bg-muted/20 p-10 lg:flex">
          <Link href="/" className="inline-flex">
            <Logo size="md" showWordmark />
          </Link>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {isSignUp ? "Create account" : "Authentication"}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {isSignUp ? "Start building forms in seconds." : "Welcome back to your workspace."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Focused forms, fast collection, and clean responses without clutter.
            </p>
          </div>
          <p className="text-xs font-mono text-muted-foreground">© 2026 FTHEFORM</p>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex">
              <Logo size="sm" showWordmark />
            </Link>
          </div>
          <div className="max-w-md">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {isSignUp ? "Get started" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {isSignUp ? "Create your account" : "Sign in to your workspace"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isSignUp ? "Your next great form starts here." : "Pick up where you left off."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 font-mono text-xs"
                disabled={isPending}
                onClick={() => handleSocialAuth("google")}
                aria-label="Sign in with Google"
              >
                <GoogleLogo className="size-4 shrink-0" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 font-mono text-xs"
                disabled={isPending}
                onClick={() => handleSocialAuth("github")}
                aria-label="Sign in with GitHub"
              >
                <GithubLogo className="size-4 shrink-0" />
                GitHub
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs font-mono text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={handleEmailAuth}>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Name
                  </Label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      autoComplete="name"
                      className="pl-9 font-sans"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <IconEmail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9 font-sans"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <IconPassword className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="pl-9 font-sans"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="h-10 w-full gap-2 font-medium" disabled={isPending}>
                {isPending && <IconSpinner className="size-4 animate-spin" />}
                {isPending
                  ? isSignUp
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "New to FTHEFORM?"}{" "}
              <Link
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                href={getAuthPageHref(isSignUp ? "/login" : "/sign-up", nextPath)}
              >
                {isSignUp ? "Log in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

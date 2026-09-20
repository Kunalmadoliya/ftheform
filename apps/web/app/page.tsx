"use client";

import { useState } from "react";
import { useGithubSignIn, useGoogleSignIn, useSignin, useSignup } from "~/hooks/auth/use-auth";

export default function Home() {
  const [signInEmail, setSignInEmail] = useState("user@example.com");
  const [signInPassword, setSignInPassword] = useState("password123");
  const [signUpEmail, setSignUpEmail] = useState("newuser@example.com");
  const [signUpPassword, setSignUpPassword] = useState("password123");
  const [signUpName, setSignUpName] = useState("Demo User");
  const [result, setResult] = useState<string>("No request sent yet.");

  const { signInAsync: signIn, isPending: signingIn } = useSignin();
  const { signUpAsync: signUp, isPending: signingUp } = useSignup();
  const { googleSignInAsync: googleSignIn, isPending: signingInWithGoogle } = useGoogleSignIn();
  const { githubSignInAsync: githubSignIn, isPending: signingInWithGithub } = useGithubSignIn();

  const handleSignIn = async () => {
    try {
      setResult("Calling /sign-in/email...");
      const response = await signIn({
        email: signInEmail,
        password: signInPassword,
      });
      setResult(`Sign-in success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`Sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSignUp = async () => {
    try {
      setResult("Calling /sign-up/email...");
      const response = await signUp({
        email: signUpEmail,
        password: signUpPassword,
        name: signUpName,
      });
      setResult(`Sign-up success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`Sign-up failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setResult("Calling Google sign-in...");
      const response = await googleSignIn();
      setResult(`Google sign-in success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`Google sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setResult("Calling GitHub sign-in...");
      const response = await githubSignIn();
      setResult(`GitHub sign-in success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`GitHub sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">FTHEFORM</p>
          <h1 className="mt-3 text-3xl font-semibold">Auth route tester</h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-medium text-cyan-300">Sign In</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Email</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingIn ? "Calling /sign-in/email..." : "Sign In"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={signingInWithGoogle}
                className="w-full rounded-lg border border-slate-600 bg-white px-4 py-2 font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingInWithGoogle ? "Calling Google sign-in..." : "Continue with Google"}
              </button>
              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={signingInWithGithub}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingInWithGithub ? "Calling GitHub sign-in..." : "Continue with GitHub"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-medium text-violet-300">Sign Up</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Name</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Email</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-300">Password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={signingUp}
                className="w-full rounded-lg bg-violet-500 px-4 py-2 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingUp ? "Calling /sign-up/email..." : "Sign Up"}
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-3 text-lg font-medium text-slate-200">Last response</h3>
          <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-sm text-cyan-200">
            {result}
          </pre>
        </section>
      </div>
    </main>
  );
}

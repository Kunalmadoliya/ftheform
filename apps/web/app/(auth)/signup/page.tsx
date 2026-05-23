"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PixelButton } from "../../../components/PixelButton";

import { AuthShell, Field, GoogleG } from "../signin/page";
import { sfx } from "../../../lib/sound";

function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      sfx.level();
      router.push("/dashboard");
    } catch (e) {
      sfx.error();
      setErr((e as Error).message);
    }
  };

  const googleSso = () => {
    try {
      sfx.level();
      router.push("/dashboard");
    } catch (e) {
      sfx.error();
      setErr((e as Error).message);
    }
  };

  return (
    <AuthShell title="New Hero" subtitle="Start building forms in 10 seconds.">
      <button
        type="button"
        onClick={googleSso}
        className="w-full mb-5 flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-quest-ink/20 bg-card rounded font-semibold text-sm hover:border-primary transition-colors shadow-pixel btn-press"
      >
        <GoogleG />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-quest-ink/10" />
        <span className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-quest-ink/10" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Hero name" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />

        {err && (
          <div className="px-3 py-2 border-2 border-destructive bg-destructive/10 text-destructive font-pixel text-xs uppercase tracking-widest">
            ⚠ {err}
          </div>
        )}

        <PixelButton type="submit" size="lg" className="w-full">
          ★ Create Account
        </PixelButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a player?{" "}
        <Link href="/signin" className="text-primary font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignupPage;

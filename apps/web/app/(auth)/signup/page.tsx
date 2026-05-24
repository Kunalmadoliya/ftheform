"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PixelButton } from "../../../components/PixelButton";
import { AuthShell, Field, GoogleG } from "../signin/page";
import { sfx } from "../../../lib/sound";

import { useSignup } from "~/hooks/api/auth";

type FormData = {
  name: string;
  email: string;
  password: string;
};

function SignupPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  const { createUserWithEmailAndPasswordAsync } = useSignup();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const submit = async (data: FormData) => {
    try {
      sfx.level();

      const { id } = await createUserWithEmailAndPasswordAsync({
        fullName: data.name,
        email: data.email,
        password: data.password,
      });

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

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Hero name" register={register("name", { required: "Name is required" })} />

        <Field
          label="Email"
          type="email"
          register={register("email", { required: "Email is required" })}
        />

        <Field
          label="Password"
          type="password"
          register={register("password", { required: "Password is required" })}
        />

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
        <Link
          href="/signin"
          onClick={() => sfx.coin()}
          className="text-primary font-semibold hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignupPage;

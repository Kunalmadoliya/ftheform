"use client";

import Link from "next/link";
import { PixelButton } from "~/components/PixelButton";
import { PixelLogo } from "~/components/PixelLogo";
import { sfx } from "~/lib/sound";
import { useSignin } from "~/hooks/api/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

type LoginFormData = {
  email: string;
  password: string;
};

function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  const { signInUserWithEmailAndPasswordAsync } = useSignin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submit = async (data: LoginFormData) => {
    try {
      sfx.level();

      const { id } = await signInUserWithEmailAndPasswordAsync({
        email: data.email,
        password: data.password,
      });

      router.replace("/dashboard");

      setErr(null);
    } catch (e) {
      sfx.error();
      setErr((e as Error).message);
    }
  };

  const useDemo = () => {
    setValue("email", "kunal@example.com");
    setValue("password", ",madoliya");
    sfx.coin();
    setErr(null);
  };

  const googleSso = () => {
    try {
      sfx.level();

      setErr(null);
    } catch (e) {
      sfx.error();
      setErr((e as Error).message);
    }
  };

  return (
    <AuthShell title="Continue Quest" subtitle="Log in to keep building forms.">
      <div className="space-y-3 mb-5">
        <button
          type="button"
          onClick={googleSso}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-quest-ink/20 bg-card rounded font-semibold text-sm hover:border-primary transition-colors shadow-pixel btn-press"
        >
          <GoogleG />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={useDemo}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-dashed border-primary/50 bg-primary/5 rounded font-pixel text-[11px] uppercase tracking-widest text-primary hover:bg-primary/10"
          title="Auto-fills the demo email + password"
        >
          ✦ Use demo credentials (1-click)
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-quest-ink/10" />
        <span className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-quest-ink/10" />
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
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
          ▶ Log In
        </PixelButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          onClick={() => sfx.click()}
          className="text-primary font-semibold hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;

export function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.9 32.3 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.8 8.8 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-1.9 1.3-4.3 2-6.9 2-5.4 0-9.9-3.2-11.5-7.7l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6 4.9c-.4.4 6.7-4.9 6.7-14.3 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-background scanlines-fixed p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <PixelLogo size={32} />
          <span className="font-pixel text-2xl tracking-tight">FTHEFORM</span>
        </Link>

        <div className="bg-card border-2 border-quest-ink shadow-pixel-lg rounded-md p-7">
          <div className="font-pixel text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Save Point
          </div>

          <h1 className="font-pixel text-4xl uppercase mb-1">{title}</h1>

          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  register,
}: {
  label: string;
  type?: string;
  register: any;
}) {
  return (
    <label className="block">
      <span className="block font-pixel text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>

      <input
        type={type}
        {...register}
        className="w-full px-3 py-2.5 rounded border-2 border-quest-ink/15 bg-background text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { IconAi, IconSpinner } from "~/components/icons/app-icons";
import { authClient } from "~/lib/auth-client";

const EXAMPLE_PROMPTS = [
  "Customer feedback survey with a 1-5 star rating, feedback details, and follow-up email",
  "Event registration with attendee name, ticket tier selection, and dietary preferences",
  "Product bug report with issue title, severity level, reproduction steps, and contact info",
] as const;

export function HeroPrompt() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const length = prompt.trim().length;
  const isValid = length >= 8 && length <= 2000;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSessionPending || isSubmitting) return;

    setIsSubmitting(true);
    try {
      localStorage.setItem(
        "pending_ai_prompt",
        JSON.stringify({ prompt: prompt.trim(), savedAt: Date.now() }),
      );
    } catch {
      // LocalStorage access may fail in private mode; proceed with redirect
    }

    if (session?.user) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
  }

  return (
    <section className="border-b border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Form Generation & Collection
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Describe your form.
            <br />
            Collect responses in seconds.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            No drag-and-drop fatigue. Generate clean, accessible forms from plain English,
            publish to a unique URL, and review structured responses.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <label htmlFor="hero-prompt-input" className="sr-only">
            Describe your form
          </label>
          <Textarea
            id="hero-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the form you need in plain English (e.g., job application with resume, portfolio link, and interview availability)..."
            rows={4}
            maxLength={2000}
            className="resize-none border-border bg-background font-sans text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              {length} / 2000 chars {length > 0 && length < 8 && "(min 8)"}
            </span>

            <Button
              type="submit"
              disabled={!isValid || isSessionPending || isSubmitting}
              className="h-10 gap-2 font-mono text-xs"
            >
              {isSubmitting ? (
                <>
                  <IconSpinner className="size-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <IconAi className="size-4" />
                  Generate form
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Or start with an example:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-left font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

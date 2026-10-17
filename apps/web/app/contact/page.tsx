import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "~/components/brand/logo";
import { ContactForm } from "~/components/contact/contact-form";
import { LandingFooter } from "~/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Contact Us | FTHEFORM",
  description: "Get in touch with the FTHEFORM team for questions, feedback, or custom inquiries.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center">
            <Logo size="sm" showWordmark />
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Go to Dashboard &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Contact Us
            </h1>
            <p className="text-sm text-muted-foreground">
              Have feedback, questions, or need support? Fill out the form below and we will respond as soon as possible.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

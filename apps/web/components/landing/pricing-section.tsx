import Link from "next/link";
import { Button } from "~/components/ui/button";

export const CONTACT_EMAIL = "";

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent tiers
          </h2>
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            Display only: plan limits are not enforced yet.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Free</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-foreground">₹0</span>
              </div>
              <ul className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-foreground" />
                  5 forms
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Button asChild variant="outline" className="w-full font-mono text-xs">
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-foreground bg-card p-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-foreground">Pro</p>
                <span className="rounded bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                  Popular
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-foreground">400 INR</span>
              </div>
              <ul className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-foreground" />
                  10 forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-foreground" />
                  10 AI credits
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Button asChild className="w-full font-mono text-xs">
                <Link href="/sign-up">Start with Pro</Link>
              </Button>
            </div>
          </div>

          {/* Business Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Business</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-foreground">Custom</span>
              </div>
              <ul className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-foreground" />
                  Contact for volume
                </li>
              </ul>
            </div>
            <div className="mt-8">
              {CONTACT_EMAIL ? (
                <Button asChild variant="outline" className="w-full font-mono text-xs">
                  <a href={`mailto:${CONTACT_EMAIL}`}>Contact us</a>
                </Button>
              ) : (
                <Button disabled variant="outline" className="w-full font-mono text-xs">
                  Contact (soon)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

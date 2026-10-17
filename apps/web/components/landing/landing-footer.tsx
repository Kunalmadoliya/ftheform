import Link from "next/link";
import { Logo } from "~/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center">
            <Logo size="sm" showWordmark />
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            © 2026 FTHEFORM
          </span>
        </div>

        <nav className="flex items-center gap-6 font-mono text-xs">
          <a
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <Link
            href="/contact"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}

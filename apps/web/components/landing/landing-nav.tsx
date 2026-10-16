"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Logo } from "~/components/brand/logo";
import { ThemeToggle } from "~/components/theme-toggle";
import { IconMenu } from "~/components/icons/app-icons";
import { authClient } from "~/lib/auth-client";

export function LandingNav() {
  const { data: session } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center">
          <Logo size="sm" showWordmark />
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-mono md:flex">
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
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {session?.user ? (
            <Button asChild size="sm" variant="default" className="h-8 font-mono text-xs">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="h-8 font-mono text-xs">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="h-8 font-mono text-xs">
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
          )}

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Open navigation menu"
                >
                  <IconMenu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 border-border bg-background p-6">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4 font-mono text-xs">
                  <a
                    href="#features"
                    onClick={() => setIsOpen(false)}
                    className="py-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setIsOpen(false)}
                    className="py-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    How it works
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setIsOpen(false)}
                    className="py-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Pricing
                  </a>
                  <div className="my-2 h-px bg-border" />
                  {session?.user ? (
                    <Button asChild size="sm" className="h-9 w-full font-mono text-xs">
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 w-full font-mono text-xs"
                      >
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="h-9 w-full font-mono text-xs"
                      >
                        <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                          Start free
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

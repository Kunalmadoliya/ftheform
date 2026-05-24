"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PixelButton } from "./PixelButton";
import { PixelLogo } from "./PixelLogo";
import { SoundToggle } from "./SoundToggle";
import { useUser } from "~/hooks/api/auth";
import { sfx } from "../lib/sound";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
  { href: "/api-docs", label: "API" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b-2 border-quest-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0" onClick={() => sfx.click()}>
          <PixelLogo size={26} />
          <span className="font-pixel text-lg sm:text-2xl tracking-tight text-quest-ink truncate">FTHEFORM</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary transition-colors">{l.label}</Link>
          ))}
          <a href="/#features" className="hover:text-primary transition-colors">Features</a>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <SoundToggle />
          {user ? (
            <Link href="/dashboard" onClick={() => sfx.click()} className="hidden sm:inline-block">
              <PixelButton size="sm">Enter Realm</PixelButton>
            </Link>
          ) : (
            <Link href="/signup" onClick={() => sfx.click()} className="hidden sm:inline-block">
              <PixelButton size="sm">Sign Up</PixelButton>
            </Link>
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => { sfx.click(); setOpen((o) => !o); }}
            className="md:hidden size-10 grid place-items-center border-2 border-quest-ink/15 rounded font-pixel text-base hover:border-primary"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t-2 border-quest-ink/10 bg-background/95 backdrop-blur-md animate-slide-up">
          <div className="px-4 py-4 flex flex-col gap-1 text-sm font-semibold uppercase tracking-widest">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-3 rounded hover:bg-secondary text-muted-foreground hover:text-primary">
                {l.label}
              </Link>
            ))}
            <a href="/#features" className="px-3 py-3 rounded hover:bg-secondary text-muted-foreground hover:text-primary">Features</a>
            <div className="h-px bg-quest-ink/10 my-2" />
            {user ? (
              <Link href="/dashboard" onClick={() => sfx.click()}>
                <PixelButton size="sm" className="w-full">Enter Realm</PixelButton>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => sfx.click()}>
                  <PixelButton size="sm" variant="ghost" className="w-full">Log In</PixelButton>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => sfx.click()}>
                  <PixelButton size="sm" className="w-full">Sign Up</PixelButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
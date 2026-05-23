"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PixelButton } from "./PixelButton";
// import { userStore, type User } from "@/lib/user-store";
import { PixelLogo } from "./PixelLogo";
import { SoundToggle } from "./SoundToggle";

export function SiteNav() {
  const path = usePathname();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser("kunal");
  }, [path]);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b-2 border-quest-ink/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3">
          <PixelLogo size={28} />
          <span className="font-pixel text-2xl tracking-tight text-quest-ink">
            FTHEFORM
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </a>
          <a href="#shop" className="hover:text-primary transition-colors">
            Shop
          </a>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle />

          {user ? (
            <Link href="/dashboard">
              <PixelButton size="sm">Enter Realm</PixelButton>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <PixelButton size="sm" variant="ghost">
                  Log In
                </PixelButton>
              </Link>

              <Link href="/signup">
                <PixelButton size="sm">Sign Up</PixelButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
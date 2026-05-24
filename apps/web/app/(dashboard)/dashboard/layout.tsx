"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PixelLogo } from "../../../components/PixelLogo";
import { LoadingScreen } from "../../../components/LoadingScreen";
import { SoundToggle } from "../../../components/SoundToggle";
import { sfx } from "../../../lib/sound";
import { useUser } from "../../../hooks/api/auth/index";
import { computeXp, progressForLevel } from "../../../lib/level";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "◆" },
  { href: "/dashboard/forms", label: "My Quests", icon: "✎" },
  { href: "/dashboard/templates", label: "Templates", icon: "▤" },
  { href: "/dashboard/responses", label: "Responses", icon: "✉" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "◔" },
  { href: "/dashboard/settings", label: "Settings", icon: "✦" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [stats, setStats] = useState({ xp: 0, level: 1, pct: 0, cur: 0, next: 0 });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      router.replace("/dashboard");
    } else {
      router.replace("/signin");
    }
    // const forms = formsStore.list();
    // const totalResponses = forms.reduce((a, f) => a + f.responses, 0);
    // const published = forms.filter((f) => f.published).length;
    // const drafts = forms.length - published;
    // const xp = computeXp({ responses: totalResponses, published, drafts });
    // const p = progressForLevel(xp);
    // setStats({ xp: p.xp, level: p.level, pct: p.pct, cur: p.cur, next: p.next });
    setOpen(false);
  }, [user, router]);

  const logout = () => {
    sfx.click();
    // Call your logout function here
    router.push("/");
  };

  if (!mounted || !user) {
    return <LoadingScreen label="Loading save file" />;
  }

  const title =
    stats.level >= 20
      ? "Archmage"
      : stats.level >= 10
        ? "Wizard"
        : stats.level >= 5
          ? "Apprentice"
          : "Novice";

  const isActive = (href: string) => {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  };

  const sidebar = (
    <>
      <Link href="/" className="flex items-center gap-3 mb-8" onClick={() => sfx.click()}>
        <PixelLogo size={28} />
        <span className="font-pixel text-xl tracking-tight leading-none">FTHEFORM</span>
      </Link>

      <div className="mb-6 px-2">
        <div className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          {user.fullName || user.email}
        </div>
        <div className="font-pixel text-lg">
          Lvl {stats.level} {title}
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="font-pixel text-[10px] mt-1 text-muted-foreground">
          XP {stats.xp.toLocaleString()} / {stats.next.toLocaleString()}
        </div>
      </div>

      <nav className="space-y-1">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold text-sm transition-colors ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="font-pixel text-base w-5">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 space-y-3">
        <div className="p-4 rounded-md border-2 border-dashed border-quest-ink/20 text-xs">
          <div className="font-pixel text-sm mb-1">★ Next Reward</div>
          <div className="text-muted-foreground">
            {Math.max(0, stats.next - stats.xp)} XP to Lvl {stats.level + 1}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={logout}
            className="text-left font-pixel text-[11px] uppercase tracking-widest text-muted-foreground hover:text-destructive px-3 py-2"
          >
            ↩ Log out
          </button>
          <SoundToggle />
        </div>
      </div>
    </>
  );

  const current = items.find((it) => isActive(it.href)) ?? items[0];

  return (
    <div className="min-h-screen scanlines-fixed bg-background md:grid md:grid-cols-[240px_1fr]">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 bg-sidebar border-b-2 border-quest-ink/10 backdrop-blur-md">
        <button
          aria-label="Open menu"
          onClick={() => {
            sfx.click();
            setOpen(true);
          }}
          className="size-10 grid place-items-center border-2 border-quest-ink/15 rounded font-pixel text-base hover:border-primary"
        >
          ☰
        </button>
        <div className="font-pixel text-sm uppercase tracking-widest truncate">kunal</div>
        <div className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">
          Lvl {stats.level}
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex bg-sidebar border-r-2 border-quest-ink/10 p-5 md:sticky md:top-0 md:h-screen flex-col">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-quest-ink/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative bg-sidebar w-72 max-w-[85vw] h-full p-5 flex flex-col border-r-2 border-quest-ink/10 animate-slide-up overflow-y-auto">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 size-9 grid place-items-center border-2 border-quest-ink/15 rounded font-pixel text-sm hover:border-destructive"
            >
              ✕
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0">{children}</main>
    </div>
  );
}

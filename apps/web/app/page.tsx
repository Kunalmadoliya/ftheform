"use client";

import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import heroWorld from "../public/background.jpeg";
import { SiteNav } from "~/components/SiteNav";

import { PixelButton } from "../components/PixelButton";
import { PixelLogo } from "../components/PixelLogo";
import { sfx } from "../lib/sound";

const features = [
  {
    icon: "✦",
    title: "Drag & Drop Builder",
    body: "9 field types — short text, ratings, multi-select, dates and more. Build in minutes.",
  },
  {
    icon: "◔",
    title: "Live Analytics",
    body: "Track responses, completion rate, and trends with real-time charts.",
  },
  {
    icon: "✉",
    title: "Response Inbox",
    body: "Every submission stored, searchable, and exportable as CSV in one click.",
  },
  {
    icon: "↯",
    title: "One-Click Share",
    body: "Hit publish to get a shareable link. Embed anywhere your players hang out.",
  },
  {
    icon: "✸",
    title: "Ready Templates",
    body: "Contact, NPS, RSVP, bug report — spin up a polished form from a preset.",
  },
];

export default function Landing() {
  return (
    <>
    <SiteNav />
      <Head>
        <title>ftheform — Build Forms Like A Game</title>
        <meta
          name="description"
          content="Retro 90s game-inspired form builder. Create, share, and collect responses with arcade-grade polish."
        />
        <meta property="og:title" content="ftheform — Build Forms Like A Game" />
        <meta
          property="og:description"
          content="Turn data collection into an adventure. Pixel-perfect forms with AAA SaaS polish."
        />
        <meta property="og:image" content="/og.jpg" />  
      </Head>

      <div className="min-h-screen scanlines-fixed">
        {/* HERO */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src={heroWorld}
              alt=""
              fill
              priority
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          </div>

          <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-2 gap-16 items-center relative">
            <div className="animate-slide-up">
              <h1 className="font-pixel text-6xl md:text-7xl lg:text-8xl leading-[0.9] uppercase mb-8 text-balance">
                Forms that feel <br />
                like an <span className="text-primary">adventure.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-[48ch] mb-10 leading-relaxed">
                Build beautiful forms with drag-and-drop, share a single link, and watch responses
                roll in. Validation, templates, analytics and CSV export — all wrapped in a retro
                pixel-perfect UI.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup" onClick={() => sfx.coin()}>
                  <PixelButton size="lg">▶ Start Building Free</PixelButton>
                </Link>
                <Link href="/login" onClick={() => sfx.click()}>
                  <PixelButton size="lg" variant="ghost">
                    Log In
                  </PixelButton>
                </Link>
              </div>
            </div>

            <TerminalMockup />
          </div>
        </header>

        {/* FEATURES */}
        <section id="features" className="px-6 py-24 bg-quest-ink text-quest-cream relative crt">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="font-pixel text-5xl uppercase mb-2">Inventory Slots</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-quest-cream/50">
                  Abilities & Mechanics
                </p>
              </div>
              <div className="hidden md:block h-px flex-1 mx-12 bg-quest-cream/15" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="group p-6 border-2 border-quest-cream/15 rounded-sm hover:border-primary transition-all hover:-translate-y-1"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="size-12 bg-primary/10 border-2 border-primary/30 rounded-sm grid place-items-center mb-5 font-pixel text-2xl text-primary group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="font-pixel text-2xl mb-2">{f.title}</h3>
                  <p className="text-sm text-quest-cream/60 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <section id="dashboard" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-pixel text-5xl md:text-6xl uppercase mb-4">Command Center</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Mission control inspired by the golden era of hardware. Track every quest from one
                cockpit.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* PRICING */}
        <section id="shop" className="py-24 px-6 bg-secondary/40">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-5 px-3 py-1 bg-card border-2 border-quest-ink/20 rounded-sm font-pixel text-xs uppercase tracking-[0.2em]">
              ◆ Item Shop
            </div>
            <h2 className="font-pixel text-5xl uppercase mb-4">Shop — Coming Soon</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Paid tiers, custom themes and team plans are being forged in the workshop. For now,
              every feature is free while you earn XP from your forms.
            </p>
            <div className="relative inline-block">
              <div className="absolute -inset-3 bg-primary/20 rounded-md blur-2xl" />
              <div className="relative p-10 rounded-md border-2 border-dashed border-quest-ink/40 bg-card shadow-pixel-lg">
                <div className="font-pixel text-6xl mb-3 animate-float">🔒</div>
                <div className="font-pixel text-2xl uppercase mb-2">Locked Chest</div>
                <p className="text-sm text-muted-foreground">
                  Level up by collecting responses — perks unlock here soon.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-quest-ink text-quest-cream py-14 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <PixelLogo size={26} />
              <span className="font-pixel text-2xl">FTHEFORM</span>
            </div>
            <div className="flex gap-8 text-[10px] font-pixel uppercase tracking-widest text-quest-cream/40">
              <a href="#" className="hover:text-primary">
                Lore
              </a>
              <a href="#" className="hover:text-primary">
                Rules
              </a>
              <a href="#" className="hover:text-primary">
                Save Point
              </a>
              <a href="#" className="hover:text-primary">
                Tavern
              </a>
            </div>
            <p className="text-[10px] font-pixel uppercase tracking-widest text-quest-cream/30">
              © 1994–2026 ftheform Co.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

function TerminalMockup() {
  return (
    <div className="relative animate-float">
      <div className="absolute -inset-6 bg-primary/20 rounded-3xl blur-3xl" />
      <div className="relative bg-quest-ink rounded-md overflow-hidden border-4 border-quest-ink shadow-pixel-lg aspect-[4/3] flex flex-col crt">
        <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-quest-cream/10 relative z-10">
          <span className="font-pixel text-primary text-sm tracking-widest">TERMINAL_v2.0</span>
          <div className="flex gap-1.5">
            <div className="size-2 rounded-full bg-quest-magenta/70" />
            <div className="size-2 rounded-full bg-primary/70" />
            <div className="size-2 rounded-full bg-accent/70" />
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6 relative z-10">
          <div>
            <div className="font-pixel text-xs text-primary/70 tracking-widest mb-2">
              QUESTION_01
            </div>
            <div className="font-pixel text-3xl text-quest-cream mb-5">
              What is your hero's name?
            </div>
            <div className="h-12 border-b-2 border-primary/50 bg-quest-cream/5 px-3 flex items-center font-pixel text-xl text-quest-cream">
              Pixel Knight<span className="animate-blink ml-1 text-primary">▌</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="bg-card rounded-lg border-2 border-quest-ink shadow-pixel-lg overflow-hidden grid md:grid-cols-[220px_1fr] min-h-[460px]">
      {/* unchanged */}
    </div>
  );
}

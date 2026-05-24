"use client";

import Link from "next/link";
import heroWorld from "../public/background.jpeg";
import { SiteNav } from "~/components/SiteNav";
import { PixelButton } from "../components/PixelButton";
import { PixelLogo } from "../components/PixelLogo";
import { sfx } from "../lib/sound";
import { useUser } from "~/hooks/api/auth";
import Image from "next/image";

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
  const { user } = useUser();

  return (
    <div className="min-h-screen scanlines-fixed">
      <SiteNav />

      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroWorld}
            alt=""
            width={1920}
            height={1080}
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
              Build beautiful forms with drag-and-drop, share a single link, and watch
              responses roll in. Validation, templates, analytics and CSV export — all
              wrapped in a retro pixel-perfect UI.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" onClick={() => sfx.coin()}>
                <PixelButton size="lg">▶ Start Building Free</PixelButton>
              </Link>
              <Link href="/signin" onClick={() => sfx.click()}>
                <PixelButton size="lg" variant="ghost">Log In</PixelButton>
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
              <p className="text-xs uppercase tracking-[0.2em] text-quest-cream/50">Abilities & Mechanics</p>
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
              Mission control inspired by the golden era of hardware. Track every quest from one cockpit.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="shop" className="py-24 px-6 bg-secondary/40">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-5 px-3 py-1 bg-card border-2 border-quest-ink/20 rounded-sm font-pixel text-xs uppercase tracking-[0.2em]">
            ◆ Item Shop
          </div>
          <h2 className="font-pixel text-5xl uppercase mb-4">Plans from ₹750/mo</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Apprentice, Adventurer, Guildmaster — pick the loadout that matches your guild size.
            Every tier ships with the builder, public + unlisted links, validation and CSV export.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/pricing" onClick={() => sfx.coin()}>
              <PixelButton size="lg" variant="primary">▶ View Pricing</PixelButton>
            </Link>
            <Link href="/explore" onClick={() => sfx.click()}>
              <PixelButton size="lg" variant="ghost">◎ Explore Public Forms</PixelButton>
            </Link>
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
            <a href="#" className="hover:text-primary">Lore</a>
            <a href="#" className="hover:text-primary">Rules</a>
            <a href="#" className="hover:text-primary">Save Point</a>
            <a href="#" className="hover:text-primary">Tavern</a>
          </div>
          <p className="text-[10px] font-pixel uppercase tracking-widest text-quest-cream/30">
            © 1994–2026 ftheform Co.
          </p>
        </div>
      </footer>
    </div>
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
            <div className="font-pixel text-xs text-primary/70 tracking-widest mb-2">QUESTION_01</div>
            <div className="font-pixel text-3xl text-quest-cream mb-5">What is your hero's name?</div>
            <div className="h-12 border-b-2 border-primary/50 bg-quest-cream/5 px-3 flex items-center font-pixel text-xl text-quest-cream">
              Pixel Knight<span className="animate-blink ml-1 text-primary">▌</span>
            </div>
          </div>
          <div className="space-y-3 opacity-50">
            <div className="h-3 w-3/4 bg-quest-cream/10 rounded-sm" />
            <div className="h-3 w-1/2 bg-quest-cream/10 rounded-sm" />
          </div>
        </div>
        <div className="mt-auto p-4 bg-black/40 flex justify-between items-center relative z-10">
          <div className="h-2 w-32 bg-quest-cream/10 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary" />
          </div>
          <span className="font-pixel text-quest-cream/60 text-xs">XP: 240/400</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="bg-card rounded-lg border-2 border-quest-ink shadow-pixel-lg overflow-hidden grid md:grid-cols-[220px_1fr] min-h-[460px]">
      <aside className="bg-sidebar border-r-2 border-quest-ink/10 p-5 flex flex-col">
        <div className="mb-8">
          <div className="font-pixel text-xs uppercase tracking-widest text-muted-foreground mb-1">Player One</div>
          <div className="font-pixel text-xl">Lvl 42 Wizard</div>
        </div>
        <nav className="space-y-1 text-sm font-semibold">
          {["Dashboard", "My Quests", "Templates", "Responses", "Analytics", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded flex items-center gap-3 ${i === 0 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
            >
              <span className={`size-1.5 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
              {item}
            </div>
          ))}
        </nav>
      </aside>
      <div className="p-8">
        <div className="flex items-end justify-between mb-8">
          <h3 className="font-pixel text-3xl uppercase">Active Realm</h3>
          <span className="text-xs font-pixel uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="size-2 bg-accent rounded-full animate-blink" /> Real-time sync
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Gold", value: "12.4k", pct: 80, color: "bg-accent" },
            { label: "Success Rate", value: "94%", pct: 94, color: "bg-primary" },
            { label: "Avg Mana", value: "12ms", pct: 20, color: "bg-quest-sky" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-md border-2 border-quest-ink/15 bg-background">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-pixel">{s.label}</div>
              <div className="font-pixel text-4xl mb-3">{s.value}</div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { n: "01", t: "Q4 Customer Satisfaction Quest", s: "ACTIVE" },
            { n: "02", t: "Dragon's Den Beta Waitlist", s: "PAUSED" },
            { n: "03", t: "Guild Recruitment Form", s: "ACTIVE" },
          ].map((q) => (
            <div key={q.n} className="p-3 flex items-center gap-4 border-2 border-quest-ink/10 rounded-md hover:border-primary transition-colors">
              <div className="size-9 grid place-items-center font-pixel bg-muted rounded">{q.n}</div>
              <div className="flex-1 font-semibold text-sm">{q.t}</div>
              <span className={`text-[10px] font-pixel uppercase tracking-widest px-2 py-1 rounded ${q.s === "ACTIVE" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                {q.s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
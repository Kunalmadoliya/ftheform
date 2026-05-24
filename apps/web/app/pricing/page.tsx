import Link from "next/link";
import { SiteNav } from "../../components/SiteNav";
import { PixelButton } from "../../components/PixelButton";

export const metadata = {
  title: "Pricing — ftheform",
  description: "Simple pixel-priced plans. Starts at ₹750/month.",
};

const tiers = [
  {
    name: "Apprentice",
    price: "₹750",
    cadence: "/mo",
    tag: "Starter",
    blurb: "Solo creators shipping their first forms.",
    perks: [
      "5 active forms",
      "1,000 responses / month",
      "All 9 field types",
      "Email + CSV export",
      "Public + unlisted links",
      "Form expiry & response cap",
    ],
    cta: "▶ Start Apprentice",
    variant: "ghost" as const,
  },
  {
    name: "Adventurer",
    price: "₹1,499",
    cadence: "/mo",
    tag: "Most Popular",
    blurb: "Growing teams running marketing + product surveys.",
    perks: [
      "Unlimited forms",
      "25,000 responses / month",
      "Conditional logic",
      "Custom themes",
      "Featured on Explore",
      "Priority email support",
    ],
    cta: "▶ Go Adventurer",
    variant: "primary" as const,
    featured: true,
  },
  {
    name: "Guildmaster",
    price: "₹4,999",
    cadence: "/mo",
    tag: "Teams",
    blurb: "Studios, communities, and high-volume operators.",
    perks: [
      "Everything in Adventurer",
      "Unlimited responses",
      "Team seats & roles",
      "Webhooks & API access",
      "Custom domain",
      "SLA + dedicated support",
    ],
    cta: "▶ Talk to us",
    variant: "ink" as const,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen scanlines-fixed">
      <SiteNav />
      <header className="px-6 pt-16 pb-10 max-w-5xl mx-auto text-center">
        <div className="font-pixel text-xs uppercase tracking-widest text-primary mb-2">◆ Item Shop</div>
        <h1 className="font-pixel text-5xl md:text-6xl uppercase mb-4">Pick your loadout</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Plans start at ₹750/month. Every tier includes the builder, public + unlisted links,
          validation, CSV export and the response inbox.
        </p>
      </header>

      <section className="px-6 pb-20 max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`p-7 rounded-md border-2 bg-card shadow-pixel flex flex-col ${
              t.featured ? "border-primary ring-4 ring-primary/15 -translate-y-1" : "border-quest-ink/15"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-pixel uppercase tracking-widest px-2 py-1 rounded bg-accent/15 text-accent">
                {t.tag}
              </span>
            </div>
            <div className="font-pixel text-2xl uppercase mb-1">{t.name}</div>
            <p className="text-sm text-muted-foreground mb-5">{t.blurb}</p>
            <div className="mb-6">
              <span className="font-pixel text-5xl">{t.price}</span>
              <span className="text-muted-foreground font-pixel text-sm uppercase tracking-widest">{t.cadence}</span>
            </div>
            <ul className="space-y-2 text-sm mb-7 flex-1">
              {t.perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="font-pixel text-primary">▸</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <PixelButton variant={t.variant} className="w-full">{t.cta}</PixelButton>
            </Link>
          </div>
        ))}
      </section>

      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <div className="p-6 rounded-md border-2 border-dashed border-quest-ink/25 bg-card text-center">
          <div className="font-pixel text-xs uppercase tracking-widest text-muted-foreground mb-2">Hackathon Demo</div>
          <p className="text-sm">
            This is a demo build — payments are not wired. All features are unlocked on the demo account.
          </p>
        </div>
      </section>
    </div>
  );
}
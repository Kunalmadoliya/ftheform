import { LandingNav } from "~/components/landing/landing-nav";
import { HeroPrompt } from "~/components/landing/hero-prompt";
import { BentoFeatures } from "~/components/landing/bento-features";
import { HowItWorks } from "~/components/landing/how-it-works";
import { PricingSection } from "~/components/landing/pricing-section";
import { LandingFooter } from "~/components/landing/landing-footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />
      <main className="flex-1">
        <HeroPrompt />
        <BentoFeatures />
        <HowItWorks />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}

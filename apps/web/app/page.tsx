"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, FileText, Menu, Plus, Sparkles, WandSparkles } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";

const benefits = [
  { title: "Build in minutes", description: "Start with the question, then add only what matters." },
  { title: "Share anywhere", description: "One clean link for every audience and every device." },
  { title: "See the signal", description: "Keep responses organized and ready for your next decision." },
];

function ProductPreview() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader className="flex-row items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><FileText className="size-3.5" /></span><span className="text-xs font-medium">New form</span></div>
        <Badge variant="secondary" className="font-normal">Draft</Badge>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 sm:p-7">
        <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Untitled form</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Team pulse check-in</h2><p className="mt-2 text-sm text-muted-foreground">A short check-in for a better week.</p></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">What should we keep doing?</span><span className="text-xs text-muted-foreground">Required</span></div><Input placeholder="Type your answer..." /></div>
        <div className="space-y-2"><span className="text-sm font-medium">How is the week feeling?</span><Button variant="outline" className="w-full justify-between font-normal text-muted-foreground">Choose an option <ChevronDown /></Button></div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-md bg-background"><WandSparkles className="size-4 text-primary" /></span><div><p className="text-sm font-medium">Ready to publish</p><p className="text-xs text-muted-foreground">2 questions, 1 minute</p></div></div><Button size="sm">Publish</Button></div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: session } = authClient.useSession();
  const workspaceHref = session?.user ? "/dashboard" : "/sign-up";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-border/60 px-6 lg:h-20 lg:border-0 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>FTHEFORM</Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"><a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a><a href="#why-ftheform" className="transition-colors hover:text-foreground">Why FTHEFORM</a></div>
        <div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href={session?.user ? "/dashboard" : "/login"}>{session?.user ? "Dashboard" : "Log in"}</Link></Button><Button asChild size="sm"><Link href={workspaceHref}>{session?.user ? "Open workspace" : "Start free"}<ArrowRight /></Link></Button><Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation"><Menu /></Button></div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-xl"><Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 font-normal"><span className="size-1.5 rounded-full bg-primary" />A simpler way to collect input</Badge><h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">Forms that turn questions into <span className="text-primary">momentum.</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">Create focused forms, share them in one click, and make better decisions with the answers.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href={workspaceHref}>{session?.user ? "Open your workspace" : "Start building free"}<ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><a href="#how-it-works">See how it works</a></Button></div><div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Check className="size-4 text-primary" />No credit card</span><span className="flex items-center gap-2"><Check className="size-4 text-primary" />Simple to share</span></div></div>
        <div className="relative"><div className="absolute -inset-8 -z-10 bg-primary/10 blur-3xl" /><ProductPreview /></div>
      </section>

      <section id="why-ftheform" className="border-y bg-muted/30"><div className="mx-auto grid max-w-7xl gap-px bg-border md:grid-cols-3 lg:px-10">{benefits.map((benefit) => <div key={benefit.title} className="bg-background px-6 py-8 lg:px-8"><div className="mb-5 flex size-9 items-center justify-center rounded-lg border bg-card"><Plus className="size-4 text-primary" /></div><h2 className="font-semibold">{benefit.title}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{benefit.description}</p></div>)}</div></section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="text-sm font-medium text-primary">Made for clarity</p><h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">Less setup. Better answers.</h2></div><div className="grid gap-8 sm:grid-cols-3"><div><p className="text-2xl font-semibold">01</p><Separator className="my-4" /><p className="font-medium">Shape the question</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Build only the fields your audience needs.</p></div><div><p className="text-2xl font-semibold">02</p><Separator className="my-4" /><p className="font-medium">Send one link</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Share a form that feels good on any screen.</p></div><div><p className="text-2xl font-semibold">03</p><Separator className="my-4" /><p className="font-medium">Move forward</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Use the signal to make the next call.</p></div></div></div></section>

      <footer className="border-t px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground"><Link href="/" className="font-medium text-foreground">FTHEFORM</Link><span>Thoughtful forms for real work.</span><span>© 2026 FTHEFORM</span></div></footer>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Check, Eye, Globe2, Save } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type BuilderHeaderProps = { title: string; onTitleChange: (title: string) => void; onTitleSave: () => void; savedAt?: string };

export function BuilderHeader({ title, onTitleChange, onTitleSave, savedAt }: BuilderHeaderProps) {
  return <header className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-3"><Button asChild variant="ghost" size="icon" aria-label="Back to dashboard"><Link href="/dashboard"><ArrowLeft /></Link></Button><Input className="h-9 max-w-xs border-transparent bg-transparent text-base font-medium shadow-none focus-visible:border-input" value={title} onChange={(event) => onTitleChange(event.target.value)} onBlur={onTitleSave} aria-label="Form title" /><span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Check className="size-3.5" />{savedAt ? `Saved ${savedAt}` : "Saved"}</span><div className="ml-auto flex items-center gap-2"><Button variant="outline" size="sm"><Eye />Preview</Button><Button size="sm"><Globe2 />Publish</Button></div></header>;
}
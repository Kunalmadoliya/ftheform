"use client";

import { useEffect } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FilePlus2, LogOut, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "~/hooks/form/use-form";
import { authClient } from "~/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { createFormAsync, isPending: isCreating } = useForm();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [createdFormId, setCreatedFormId] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) router.replace("/login");
  }, [isPending, router, session]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
  }

  async function handleCreateForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    try {
      const form = await createFormAsync({
        title,
        description: description || undefined,
      });
      setCreatedFormId(form.id);
      setTitle("");
      setDescription("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create the form.");
    }
  }

  if (isPending || !session?.user) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><a className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em]" href="/"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>FTHEFORM</a><Button variant="ghost" onClick={handleSignOut}><LogOut />Sign out</Button></div></header>
      <section className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Your workspace</p><div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-4xl font-semibold tracking-tight">Good to see you, {session.user.name}.</h1><p className="mt-3 text-muted-foreground">Create your next form and start collecting useful input.</p></div><Button size="lg" onClick={() => { setCreateError(""); setIsCreateDialogOpen(true); }}><FilePlus2 />Create a form <ArrowRight /></Button></div>{createdFormId ? <div className="mt-8 rounded-xl border border-chart-2/30 bg-chart-2/10 p-4 text-sm">Form created successfully. <span className="font-mono text-xs">{createdFormId}</span></div> : null}<div className="mt-14 rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-medium">Your forms will appear here.</p><p className="mt-2 text-sm text-muted-foreground">Start with a focused question and build from there.</p></div></section>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}><DialogContent><DialogHeader><DialogTitle>Create a form</DialogTitle><DialogDescription>Give your form a clear purpose so people know how to respond.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={handleCreateForm}><div className="space-y-2"><Label htmlFor="form-title">Title</Label><Input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Team pulse check-in" required /></div><div className="space-y-2"><Label htmlFor="form-description">Description</Label><Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What would you like to learn?" /></div>{createError ? <p className="text-sm text-destructive" role="alert">{createError}</p> : null}<DialogFooter><Button type="submit" disabled={isCreating}>{isCreating ? "Creating..." : "Create form"}</Button></DialogFooter></form></DialogContent></Dialog>
    </main>
  );
}

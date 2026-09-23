"use client";

import { useEffect } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FilePlus2, LogOut, Pencil, Sparkles, Trash2 } from "lucide-react";

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
  const {
    createFormAsync,
    deleteFormAsync,
    forms,
    formsQuery,
    isPending: isCreating,
    renameFormAsync,
    updateFormDescriptionAsync,
  } = useForm();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [editingFormId, setEditingFormId] = useState("");
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

  function openEditDialog(formId: string, formTitle: string, formDescription: string | null) {
    setEditingFormId(formId);
    setTitle(formTitle);
    setDescription(formDescription ?? "");
    setEditError("");
    setIsEditDialogOpen(true);
  }

  async function handleEditForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError("");

    try {
      await renameFormAsync({ formId: editingFormId, title });
      await updateFormDescriptionAsync({
        formId: editingFormId,
        description: description || null,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to update the form.");
    }
  }

  async function handleDeleteForm(formId: string) {
    if (!window.confirm("Delete this form? This cannot be undone.")) return;

    try {
      await deleteFormAsync({ formId });
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to delete the form.");
    }
  }

  if (isPending || !session?.user) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><a className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em]" href="/"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>FTHEFORM</a><Button variant="ghost" onClick={handleSignOut}><LogOut />Sign out</Button></div></header>
      <section className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Your workspace</p><div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-4xl font-semibold tracking-tight">Good to see you, {session.user.name}.</h1><p className="mt-3 text-muted-foreground">Create your next form and start collecting useful input.</p></div><Button size="lg" onClick={() => { setCreateError(""); setIsCreateDialogOpen(true); }}><FilePlus2 />Create a form <ArrowRight /></Button></div>{createdFormId ? <div className="mt-8 rounded-xl border border-chart-2/30 bg-chart-2/10 p-4 text-sm">Form created successfully. <span className="font-mono text-xs">{createdFormId}</span></div> : null}{editError ? <p className="mt-6 text-sm text-destructive" role="alert">{editError}</p> : null}<div className="mt-14">{formsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading your forms...</p> : forms.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-medium">Your forms will appear here.</p><p className="mt-2 text-sm text-muted-foreground">Start with a focused question and build from there.</p></div> : <div className="grid gap-4 md:grid-cols-2">{forms.map((form) => { const createdAt = new Date(form.createdAt); return <article className="rounded-2xl border border-border bg-card p-6" key={form.id}><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{form.title}</h2><p className="mt-2 min-h-6 text-sm text-muted-foreground">{form.description || "No description"}</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{form.isPublished ? "Published" : "Draft"}</span></div><div className="mt-6 flex items-center justify-between gap-3"><time className="text-xs text-muted-foreground" dateTime={createdAt.toISOString()}>{createdAt.toLocaleDateString()}</time><div className="flex gap-2"><Button aria-label={`Edit ${form.title}`} size="icon" variant="outline" onClick={() => openEditDialog(form.id, form.title, form.description ?? null)}><Pencil /></Button><Button aria-label={`Delete ${form.title}`} size="icon" variant="ghost" onClick={() => handleDeleteForm(form.id)}><Trash2 /></Button></div></div></article>; })}</div>}</div></section>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent><DialogHeader><DialogTitle>Edit form</DialogTitle><DialogDescription>Keep the form title and description clear for respondents.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={handleEditForm}><div className="space-y-2"><Label htmlFor="edit-form-title">Title</Label><Input id="edit-form-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="edit-form-description">Description</Label><Textarea id="edit-form-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>{editError ? <p className="text-sm text-destructive" role="alert">{editError}</p> : null}<DialogFooter><Button type="submit">Save changes</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}><DialogContent><DialogHeader><DialogTitle>Create a form</DialogTitle><DialogDescription>Give your form a clear purpose so people know how to respond.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={handleCreateForm}><div className="space-y-2"><Label htmlFor="form-title">Title</Label><Input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Team pulse check-in" required /></div><div className="space-y-2"><Label htmlFor="form-description">Description</Label><Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What would you like to learn?" /></div>{createError ? <p className="text-sm text-destructive" role="alert">{createError}</p> : null}<DialogFooter><Button type="submit" disabled={isCreating}>{isCreating ? "Creating..." : "Create form"}</Button></DialogFooter></form></DialogContent></Dialog>
    </main>
  );
}
